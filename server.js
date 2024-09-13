import express from 'express';
import multer from 'multer';
import Replicate from 'replicate';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';
import OpenAI from 'openai'; // 使用 openai 的库

// 初始化环境变量
config();

// 初始化 OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = 3000;

// 设置图片上传路径
const upload = multer({ dest: 'uploads/' });

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 处理 Replicate API 请求
app.post('/api/replicate', upload.single('image'), async (req, res) => {
    const { text } = req.body;
    const image = req.file;

    try {
        const imageBuffer = fs.readFileSync(image.path);
        const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        const prompt = `This is a news cover image, which needs to be transformed into a particle-based visual style. The core content of the image is ${text}. ...`;

        const output = await replicate.run(
            "levelsio/neon-tokyo:64d1f3c37e1702a4b659e6373b3e4b7b4d1feda75337d9581bc3e893df516436", 
            {
                input: {
                    prompt: prompt,
                    image: imageBase64,
                    lora_scale: 0.75,
                    num_outputs: 4,
                    aspect_ratio: "4:3",
                    output_format: "jpg",
                    output_quality: 80,
                    extra_lora_scale: 0.8
                },
            }
        );
        res.json({ image: output[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing the request');
    } finally {
        fs.unlinkSync(image.path);
    }
});

// 处理 OpenAI API 请求
app.post('/api/generate-text', async (req, res) => {
    const { prompt } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // 使用你需要的模型
            prompt: prompt,
            temperature: 0.7,
            max_tokens: 64,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const answer = response.data.choices[0].text;
        res.json({ text: answer });
    } catch (error) {
        console.error("OpenAI API Error: ", error);
        res.status(500).json({ error: 'Error generating text', details: error.message });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
