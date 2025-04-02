import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Delete, 
    Put, 
    UseGuards, 
    Req,
    UseInterceptors, 
    UploadedFile,
    BadRequestException 
  } from '@nestjs/common';
  import { 
    ApiBearerAuth, 
    ApiOperation, 
    ApiParam, 
    ApiResponse, 
    ApiTags,
    ApiConsumes,
    ApiBody
  } from '@nestjs/swagger';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { UsersService } from './users.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('users')
  @Controller('user')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Post()
    @ApiOperation({ summary: '새 사용자 등록' })
    @ApiResponse({ status: 201, description: '사용자가 성공적으로 등록됨' })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    @ApiResponse({ status: 409, description: '사용자명 또는 이메일이 이미 존재함' })
    async create(@Body() createUserDto: CreateUserDto) {
      return this.usersService.create(createUserDto);
    }
  
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '내 프로필 조회' })
    @ApiResponse({ status: 200, description: '프로필 조회 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async getProfile(@Req() req) {
      return this.usersService.findById(req.user.id);
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '특정 사용자 조회' })
    @ApiParam({ name: 'id', description: '사용자 ID' })
    @ApiResponse({ status: 200, description: '사용자 조회 성공' })
    @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
    async findOne(@Param('id') id: string) {
      return this.usersService.findById(id.toString());
    }
  
    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '내 프로필 수정' })
    @ApiResponse({ status: 200, description: '프로필 수정 성공' })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async update(@Body() updateUserDto: UpdateUserDto, @Req() req) {
      return this.usersService.update(req.user.id, updateUserDto);
    }
  
    @Post('profile/image')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '프로필 이미지 업로드' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads/profiles',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = extname(file.originalname);
            cb(null, `profile-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new BadRequestException('지원되지 않는 이미지 형식입니다'), false);
          }
          cb(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
      }),
    )
    async uploadProfileImage(@UploadedFile() file, @Req() req) {
      if (!file) {
        throw new BadRequestException('이미지 파일을 업로드해주세요');
      }
  
      const profileImage = `/uploads/profiles/${file.filename}`;
      
      // 프로필 이미지 경로 업데이트
      await this.usersService.update(req.user.id, { profileImage });
      
      return { profileImage };
    }
  
    @Delete('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '회원 탈퇴' })
    @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async remove(@Req() req) {
      return this.usersService.remove(req.user.id);
    }
  }