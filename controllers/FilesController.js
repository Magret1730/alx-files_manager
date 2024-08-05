import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const {
      name,
      type,
      parentId = '0',
      isPublic = false,
      data,
    } = req.body;

    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // const key = `auth_${token}`;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const typeList = ['folder', 'file', 'image'];
    if (!type || !typeList.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if ((!data) && (type !== 'folder')) {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const files = database.collection('files');

      if (parentId !== '0') {
        // const file = await files.findOne({ parentId });
        const parentFile = await files.findOne({ _id: new ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });

          // The user ID should be added to the document saved in DB - as owner of a file
        }
      }
      const fileDocument = {
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? 0 : new ObjectId(parentId),
      };

      if (type === 'folder') {
        // const newFile = await dbClient.collection('files').insertOne(fileDocument);
        const newFile = await files.insertOne(fileDocument);
        fileDocument.id = newFile.insertedId;
        // return res.status(201).json(newFile.ops[0]);
        return res.status(201).json({
          id: newFile.insertedId,
          userId,
          name,
          type,
          isPublic,
          parentId: fileDocument.parentId,
        });
      }

      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = uuidv4();
      const localPath = path.join(folderPath, fileName);

      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(localPath, Buffer.from(data, 'base64'));

      fileDocument.localPath = localPath;

      const newFile = await files.insertOne(fileDocument);
      fileDocument.id = newFile.insertedId;

      // const {
      //   id,
      //   userId: userIdResponse,
      //   name: nameResponse,
      //   type: typeResponse,
      //   isPublic: isPublicResponse,
      //   parentId: parentIdResponse,
      // } = fileDocument;

      // return res.status(201).json(newFile.ops[0]);
      // return res.status(201).json({
      //   id,
      //   userId: userIdResponse,
      //   name: nameResponse,
      //   type: typeResponse,
      //   isPublic: isPublicResponse,
      //   parentId: parentIdResponse,
      // });
      return res.status(201).json({
        id: newFile.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId: fileDocument.parentId,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default FilesController;
