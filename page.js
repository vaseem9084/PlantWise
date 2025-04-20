


'use client'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Function to convert file to GenerativeAI ImagePart
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    },
  };
}

export default function Home() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onDrop = async (acceptedFiles) => {
    try {
      const file = acceptedFiles[0]
      if (!file) return

      setImage(file)
      setPreview(URL.createObjectURL(file))
      await identifyPlant(file)
    } catch (err) {
      setError('Error processing the image. Please try again.')
      console.error('Drop error:', err)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false,
    maxSize: 4194304 // 4MB max size
  })

  const identifyPlant = async (file) => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('API key not found')
      }

      // Initialize the API
      const genAI = new GoogleGenerativeAI(apiKey)
      
      // Load the model
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Convert the file to the required format
      const imagePart = await fileToGenerativePart(file)

      // Prepare the prompt
      const prompt = `Analyze this plant image and provide the following information in a clear, structured format:

1. Common Name:
2. Scientific Name:
3. Plant Family:
4. Key Characteristics:
   - Leaf type
   - Flower color (if visible)
   - Growth habit
5. Growing Conditions:
   - Light requirements
   - Water needs
   - Soil preferences
6. Care Tips:
   - Watering schedule
   - Fertilization
   - Common issues

7. Insects and Pest Controls:
      -physical method
      -biological
      -chemical
8. Disease Controls:
      -physical method
      -biological
      -chemical

9. Life cycle:

10. season for the sowing:


also give the above points  information in Hindi



Please be specific and concise.`

      // Generate content
      const result = await model.generateContent([
        prompt,
        imagePart
      ])

      const response = await result.response
      const text = response.text()
      
      if (!text) {
        throw new Error('No response from API')
      }

      setResult(text)
    } catch (err) {
      console.error('Identification error:', err)
      if (err.message === 'API key not found') {
        setError('Missing API key. Please add your Gemini API key to the .env.local file.')
      } else if (err.message === 'No response from API') {
        setError('Could not identify the plant. Please try another image.')
      } else {
        setError('Error connecting to the identification service. Please check your API key and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ... rest of the component remains the same as before ...
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-green-800 mb-8">
        Plant Identifier
      </h1>
      
      <div className="max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-gray-600">
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <div>
                  <p className="mb-2">Drag & drop a plant image here, or click to select one</p>
                  <p className="text-sm text-gray-500">Maximum file size: 4MB</p>
                </div>
              )}
            </div>
            
            {preview && (
              <div className="mt-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing your plant...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-medium">{error}</p>
            {error.includes('API key') && (
              <p className="text-sm mt-2">
                Make sure you have set up your Gemini API key correctly in the .env.local file.
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Plant Information</h2>
            <div className="prose prose-green max-w-none">
              {result.split('\n').map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}