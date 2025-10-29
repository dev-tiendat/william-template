import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'

import { UserService } from '../user/user.service'

import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { LocalGuard } from './guards/local.guard'
import { LoginResponse } from './models/auth.model'

@ApiTags('Auth - Authentication Module')
@UseGuards(LocalGuard)
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) { }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResult({ type: LoginResponse })
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    const result = await this.authService.loginWithEmail(
      dto.email,
      dto.password,
    )
    return result
  }

  @Post('register')
  @ApiOperation({ summary: 'Register and auto login' })
  @ApiResult({ type: LoginResponse })
  async register(@Body() dto: RegisterDto): Promise<LoginResponse> {
    await this.userService.register(dto)

    // Auto login after successful registration
    const result = await this.authService.loginWithEmail(
      dto.email,
      dto.password,
    )
    return result
  }
}
