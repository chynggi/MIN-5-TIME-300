import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  category: number;
  
  @Column('simple-array', { nullable: true, default: [] })
  tags: string[];

  @Column()
  authorId: string;

  @ManyToOne(() => User, user => user.questions)
  @JoinColumn({ name: 'authorId' })
  author: User;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}