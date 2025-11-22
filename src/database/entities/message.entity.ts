import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { School } from './school.entity';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant: School relationship
  @Index('idx_student_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Index()
  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Index()
  @Column({ name: 'receiver_id' })
  receiverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'is_archived_by_sender', default: false })
  isArchivedBySender: boolean;

  @Column({ name: 'is_archived_by_receiver', default: false })
  isArchivedByReceiver: boolean;

  @Column({ name: 'is_deleted_by_sender', default: false })
  isDeletedBySender: boolean;

  @Column({ name: 'is_deleted_by_receiver', default: false })
  isDeletedByReceiver: boolean;

  @Column({ name: 'parent_message_id', nullable: true })
  parentMessageId: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'parent_message_id' })
  parentMessage: Message;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}