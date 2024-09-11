import 'dotenv/config'
import { SpeechClient } from '@google-cloud/speech';
import { v2 } from '@google-cloud/translate';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { readFileSync, writeFileSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';

function convertToMono(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)  // Convert to mono
      .on('end', () => resolve())
      .on('error', (err: any) => reject(err))
      .save(outputPath);
  });
}

const speechClient = new SpeechClient();
const translateClient = new v2.Translate();
const textToSpeechClient = new TextToSpeechClient();

// Function to transcribe audio (Speech-to-Text)
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const request = {
    config: {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 44100,
      languageCode: 'en-US',
    },
    audio: {
      content: audioBuffer.toString('base64'),
    },
  };
  const [response] = await speechClient.recognize(request);
  if (!response.results) throw new Error('No transcription results found');
  const transcription = response.results.map(result => result.alternatives?.[0]?.transcript).join('\n');
  return transcription;
}

// Function to translate text (Text Translation)
async function translateText(text: string, targetLanguage: string): Promise<string> {
  const [translation] = await translateClient.translate(text, targetLanguage);
  return translation;
}

// Function to convert text to speech (Text-to-Speech)
async function synthesizeSpeech(text: string, languageCode: string): Promise<Buffer> {
  const request = {
    input: { text },
    voice: { languageCode, ssmlGender: 'NEUTRAL' as const },
    audioConfig: { audioEncoding: 'MP3' as const },
  };
  const [response] = await textToSpeechClient.synthesizeSpeech(request);
  return Buffer.from(response.audioContent as string, 'base64');
}

// Function to process the entire flow
async function processAudio(inputAudioPath: string, targetLanguage: string) {

  const monoAudioPath = './test_mono.wav';

  // Convert to mono first
  await convertToMono(inputAudioPath, monoAudioPath);

  const audioBuffer = readFileSync(monoAudioPath);
  const transcription = await transcribeAudio(audioBuffer);
  console.log('Transcription:', transcription);

  const translation = await translateText(transcription, targetLanguage);
  console.log('Translation:', translation);

  const speechBuffer = await synthesizeSpeech(translation, targetLanguage);
  console.log('Speech synthesized successfully');

  // Save or stream the speechBuffer as needed
  // save to file result.m4a
  writeFileSync('result.wav', speechBuffer);

}

// Example usage
processAudio('./test.wav', 'pt-BR')
  .then(() => console.log('Processing complete'))
  .catch(err => console.error('Error:', err));
