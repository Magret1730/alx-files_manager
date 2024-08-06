import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import Bull from 'bull';
import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fileQueue = new Bull('fileQueue');

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

      // If the file is an image, add a job to the queue
      if (fileDocument.type === 'image') {
        fileQueue.add({ userId, fileId: newFile.insertedId });
      }

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

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    // console.log(`ID from getShow: ${id}`);

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      // console.log(`USERID from getShow: ${userId}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const files = database.collection('files');

      const fileDocument = await files.findOne({
        id: new ObjectId(id),
        userId: new ObjectId(userId),
      });
      // console.log(`_id from getShow: ${_id} and userId from getShow: ${userId}`);

      if (!fileDocument) {
        return res.status(404).json({ error: 'Not Found' });
      }

      return res.status(200).json(fileDocument);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = '0', page = '0' } = req.query;

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      // console.log(`USERID from getShow: ${userId}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const files = database.collection('files');

      const query = {
        userId: new ObjectId(userId),
        parentId: parentId === '0' ? 0 : new ObjectId(parentId),
      };

      const limit = 20;
      const skip = parseInt(page, 10) * limit;

      const fileDocument = await files.find(query).skip(skip).limit(limit).toArray();

      return res.status(200).json(fileDocument);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      // console.log(`USERID from getShow: ${userId}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const files = database.collection('files');

      const fileDocument = await files.findOne({
        id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      if (!fileDocument) {
        return res.status(404).json({ error: 'Not Found' });
      }

      await files.updateOne(
        { id: new ObjectId(id) },
        { $set: { isPublic: true } },
      );

      const updatedFileDocument = await files.findOne({
        id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      return res.status(200).json(updatedFileDocument);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      // console.log(`USERID from getShow: ${userId}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const files = database.collection('files');

      const fileDocument = await files.findOne({
        id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      if (!fileDocument) {
        return res.status(404).json({ error: 'Not Found' });
      }

      await files.updateOne(
        { id: new ObjectId(id) },
        { $set: { isPublic: false } },
      );

      const updatedFileDocument = await files.findOne({
        id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      return res.status(200).json(updatedFileDocument);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { size } = req.query;

    // Validate the size parameter
    const validSizes = ['500', '250', '100'];
    if (size && !validSizes.includes(size)) {
      return res.status(400).json({ error: 'Invalid size parameter' });
    }

    try {
      const userId = await redisClient.getAsync(`auth_${token}`);
      // console.log(`USERID from getShow: ${userId}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const files = database.collection('files');

      const fileDocument = await files.findOne({
        id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      if (!fileDocument) {
        return res.status(404).json({ error: 'Not Found' });
      }

      if (fileDocument.isPublic === false) {
        return res.status(404).json({ error: 'Not Found' });
      }

      if (fileDocument.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // const filePath = fileDocument.localPath;
      // Determine the localPath based on the size parameter
      let filePath = fileDocument.localPath;
      if (size) {
        const filePathWithSize = path.join(path.dirname(filePath), `${path.basename(filePath)}_${size}`);
        try {
          await fs.access(filePathWithSize);
          filePath = filePathWithSize;
        } catch (err) {
          return res.status(404).json({ error: 'Not Found' });
        }
      }

      const mimeType = mime.lookup(fileDocument.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);

      // Check if the file is a text file and read its content
      if (mimeType.startsWith('text/')) {
        const data = await fs.readFile(filePath, 'utf-8');
        return res.send(data);
      }

      // For binary files, stream the content
      const fileStream = createReadStream(filePath);
      return fileStream.pipe(res);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default FilesController;
