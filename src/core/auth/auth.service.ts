import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/roles/entities/user-role.entity';
import { UserStatus } from '../../common/enums';
import { EVENTS } from '../../common/constants';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/login.dto';
import { StringUtil } from '../../common/utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user || !user.isActive()) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.incrementFailedLoginAttempts(user);
      return null;
    }

    await this.resetFailedLoginAttempts(user);
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const tokens = await this.generateTokens(user);

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    this.eventEmitter.emit(EVENTS.USER.UPDATED, {
      userId: user.id,
      action: 'LOGIN',
      timestamp: new Date(),
    });

    const { roles, permissions } = await this.loadUserRolesAndPermissions(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles,
        permissions,
        organizationId: user.organizationId,
        avatar: user.avatar,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive()) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');

    const isValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isValid) throw new BadRequestException('Mật khẩu hiện tại không đúng');

    const saltRounds = this.configService.get<number>('app.bcryptSaltRounds') || 12;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    this.eventEmitter.emit(EVENTS.USER.PASSWORD_CHANGED, { userId });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      return {
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu',
      };
    }

    const resetToken = StringUtil.random(32);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetTokenExpiry,
    });

    this.eventEmitter.emit(EVENTS.USER.PASSWORD_RESET, {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      resetToken,
    });

    return { message: 'Email đặt lại mật khẩu đã được gửi' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const saltRounds = this.configService.get<number>('app.bcryptSaltRounds') || 12;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      passwordChangedAt: new Date(),
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    const { roles, permissions } = await this.loadUserRolesAndPermissions(userId);
    return { ...user, roles, permissions };
  }

  private async loadUserRolesAndPermissions(
    userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role', 'role.permissions'],
    });

    const roles = [...new Set(userRoles.filter((ur) => ur.role?.isActive).map((ur) => ur.role.code))];

    const permSet = new Set<string>();
    for (const ur of userRoles) {
      if (ur.role?.isActive) {
        for (const perm of ur.role.permissions ?? []) {
          permSet.add(perm.code);
        }
      }
    }

    return { roles, permissions: [...permSet] };
  }

  private async generateTokens(user: User) {
    const { roles, permissions } = await this.loadUserRolesAndPermissions(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions,
      organizationId: user.organizationId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async incrementFailedLoginAttempts(user: User) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates: Partial<User> = { failedLoginAttempts: attempts };

    if (attempts >= 5) {
      updates.status = UserStatus.LOCKED;
    }

    await this.userRepository.update(user.id, updates);
  }

  private async resetFailedLoginAttempts(user: User) {
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.update(user.id, { failedLoginAttempts: 0 });
    }
  }
}
