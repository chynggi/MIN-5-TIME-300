import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Question } from '../../questions/entities/question.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: false })
  isAdmin: boolean;
  
  @Column({ nullable: true })
  mbti: string;
  
  @Column({ default: 0 })
  loginAttempts: number;
  
  @Column({ nullable: true })
  lastLoginAttempt: Date;

  @OneToMany(() => Question, question => question.author)
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}