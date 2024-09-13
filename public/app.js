// 显示上传的图片
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const uploadedImage = document.getElementById('uploadedImage');
        uploadedImage.src = e.target.result;
        uploadedImage.style.display = 'block';
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

// 调用 Replicate 的逻辑
document.getElementById('submitBtn').addEventListener('click', async () => {
    const imageInput = document.getElementById('imageInput');
    const textInput = document.getElementById('textInput').value;

    if (imageInput.files.length === 0 || !textInput) {
        alert('Please upload an image and enter text.');
        return;
    }

    // 显示 loading 层
    document.getElementById('loadingOverlay').style.display = 'flex';

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('text', textInput);

    try {
        // 调用 Replicate 的 API 来生成图像
        const response = await fetch('/api/replicate', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        // 显示生成的图像
        document.getElementById('resultImage').src = result.image;
        document.getElementById('resultImage').style.display = 'block';

        // 固定文本模板与用户输入结合
        const prompt = `Input Text Recognition:\nAnalyze the "${textInput}", extract key content and information.\n\nAI Theme Introduction:\nWhile preserving the core content of the original text, introduce descriptions related to AI, emphasizing how AI technology integrates with the topic and brings positive impacts to society, industry, or individuals.\n\nText Balance:\nEnsure that the modified text is similar in length to the original input, retaining at least 50% of the original content. The benefits and potential of AI are smoothly incorporated through logical transitions and expansion.`;

        // 调用 OpenAI 的 API 来生成文字
        const gptResponse = await fetch('/api/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        // 检查是否为有效的 JSON 响应
        if (!gptResponse.ok) {
            const errorText = await gptResponse.text(); // 如果不是 JSON，读取文本
            throw new Error(errorText); // 抛出错误
        }

        const gptResult = await gptResponse.json(); // 解析为 JSON
        document.getElementById('resultText').textContent = gptResult.text;

    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to process the image and text: ${error.message}`);
    } finally {
        // 隐藏 loading 层
        document.getElementById('loadingOverlay').style.display = 'none';
    }
});
