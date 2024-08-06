import Bull from 'bull';
import { promises as fs } from 'fs';
// import path from 'path';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const database = dbClient.client.db(dbClient.databaseName);
  const files = database.collection('files');

  const fileDocument = await files.findOne({
    id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!fileDocument) throw new Error('File not found');

  const filePath = fileDocument.localPath;

  const generateThumbnail = async (size) => {
    const options = { width: size };
    const thumbnail = await imageThumbnail(filePath, options);
    const thumbnailPath = `${filePath}_${size}`;
    await fs.writeFile(thumbnailPath, thumbnail);
  };

  try {
    await generateThumbnail(500);
    await generateThumbnail(250);
    await generateThumbnail(100);
  } catch (error) {
    throw new Error(`Error generating thumbnails: ${error.message}`);
  }
});

fileQueue.on('completed', (job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

fileQueue.on('failed', (job, err) => {
  console.error(`Job with id ${job.id} has failed with error ${err.message}`);
});
