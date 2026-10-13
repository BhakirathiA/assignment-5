import "reflect-metadata";
import { Entity, ObjectIdColumn, Column } from "typeorm";
import { ObjectId } from "mongodb";

export type Attachment = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
};

@Entity()
export class Task {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column({ type: "string" })
  title!: string;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Column({ type: "date", nullable: true })
  dueDate?: Date;

  @Column({ type: "simple-json", default: [] })
  attachments!: Attachment[];
}