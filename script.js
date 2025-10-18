let products = [];

fetch('products.json')
  .then(res => res.json())
  .then(data => products = data);

const searchBtn = document.getElementById('search-btn');
const manualInput = document.getElementById('manual-barcode');
const resultSection = document.getElementById('result-section');
const productName = document.getElementById('product-name');
const productImage = document.getElementById('product-image');
const ecoDetails = document.getElementById('eco-details');
const ecoSummary = document.getElementById('eco-summary');
const cameraContainer = document.getElementById('camera-container');
const stopScanBtn = document.getElementById('stop-scan');
const video = document.getElementById('camera');
const scannedBarcode = document.getElementById('scanned-barcode');
const barcodeDisplay = document.getElementById('barcode-display');

function getGradeColor(score) {
  if (score >= 13) return { grade: 'A', color: '#2e7d32' };
  if (score >= 10) return { grade: 'B', color: '#c0ca33' };
  if (score >= 7)  return { grade: 'C', color: '#ffa726' };
  if (score >= 4)  return { grade: 'D', color: '#ef5350' };
  return { grade: 'E', color: '#b71c1c' };
}

function showProduct(product) {
  const { grade, color } = getGradeColor(product["Total Eco Score"]);

  resultSection.classList.remove('hidden');
  productName.textContent = product["Product Name"];
  productImage.src = product.Image.startsWith('http') ? product.Image : `images/${product.Image}`;
  ecoSummary.textContent = `Eco Score: ${product["Total Eco Score"]} / 15 — Grade: ${grade}`;
  ecoSummary.style.backgroundColor = color;

  ecoDetails.textContent = `🚚 Transport: ${product["Transport Score"]} (${product["Transport Distance (km)"]} Km)
📦 Packaging: ${product["Packaging Score"]} (${product["Packaging Type"]})
🌱 Ingredient: ${product["Ingredient Score"]} (${product["Impacting Ingredient"]})`;
}

searchBtn.addEventListener('click', () => {
  const barcode = manualInput.value.trim();
  const product = products.find(p => p.Barcode === barcode);
  if (!product) return alert('Product not found');
  showProduct(product);
});

document.getElementById('start-scan').addEventListener('click', async () => {
  cameraContainer.classList.remove('hidden');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  video.srcObject = stream;

  const detector = new BarcodeDetector({ formats: ['ean_13'] });

  const scanLoop = async () => {
    const bitmap = await createImageBitmap(video);
    const barcodes = await detector.detect(bitmap);
    if (barcodes.length > 0) {
      const code = barcodes[0].rawValue;
      manualInput.value = code;
      scannedBarcode.textContent = code;
      barcodeDisplay.classList.remove('hidden');
      stream.getTracks().forEach(track => track.stop());
      cameraContainer.classList.add('hidden');
    } else {
      requestAnimationFrame(scanLoop);
    }
  };

  scanLoop();
});

stopScanBtn.addEventListener('click', () => {
  const stream = video.srcObject;
  if (stream) stream.getTracks().forEach(track => track.stop());
  cameraContainer.classList.add('hidden');
});

document.getElementById('image-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    alert('No image selected.');
    return;
  }

  Quagga.decodeSingle({
    src: URL.createObjectURL(file),
    numOfWorkers: 0,
    inputStream: {
      size: 800 // optional: controls resolution
    },
    decoder: {
      readers: ['ean_reader'] // supports EAN-13 barcodes
    }
  }, result => {
    if (result && result.codeResult) {
      const code = result.codeResult.code;
      manualInput.value = code;
      scannedBarcode.textContent = code;
      barcodeDisplay.classList.remove('hidden');
    } else {
      alert('Barcode not detected in image.');
    }
  });
});
