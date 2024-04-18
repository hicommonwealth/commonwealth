import axios from 'axios';
import byline from 'byline';
import { QueryTypes, Sequelize } from 'sequelize';

export async function streamDumpImport(dumpUrl: string, model: Sequelize) {
  const response = await axios({
    method: 'get',
    url: dumpUrl,
    responseType: 'stream',
  });

  const lineStream = byline.createStream(response.data);
  let queryBuffer = '';

  lineStream.on('data', async (line) => {
    const lineText = line.toString();

    // Skip empty lines and comments
    if (!lineText.trim() || lineText.startsWith('--')) {
      return;
    }

    // Add line to buffer
    queryBuffer += lineText;

    // Check if the line ends with a semicolon indicating end of the statement
    if (lineText.trim().endsWith(';')) {
      lineStream.pause(); // Pause the stream

      try {
        if (queryBuffer.trim() != 'CREATE SCHEMA public;') {
          await model.query(queryBuffer, {
            type: QueryTypes.RAW,
          });
        }
        queryBuffer = ''; // Clear buffer after executing
      } catch (err) {
        lineStream.destroy(new Error('discourse dump import error'));
        throw err;
      }

      lineStream.resume(); // Resume the stream
    }
  });

  lineStream.on('end', () => {
    console.log('SQL dump stream processing completed.');
  });

  lineStream.on('error', (error) => {
    console.error('Stream error:', error);
  });
}
