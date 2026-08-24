const photoCount = 6;
const photos = Array.from({ length: photoCount }, () => ({ src: '', x: 50, y: 50, scale: 100, aspectRatio: null }));
let selectedIndex = 0;

const editorGrid = document.querySelector('#photo-editor-grid');
const collageGrid = document.querySelector('#collage-grid');
const editorTemplate = document.querySelector('#editor-card-template');
const previewTemplate = document.querySelector('#preview-card-template');
const titleInput = document.querySelector('#title-input');
const previewTitle = document.querySelector('#preview-title');
const paper = document.querySelector('#a4-paper');
const xSlider = document.querySelector('#position-x');
const ySlider = document.querySelector('#position-y');
const xOutput = document.querySelector('#position-x-output');
const yOutput = document.querySelector('#position-y-output');
const scaleSlider = document.querySelector('#photo-scale');
const scaleOutput = document.querySelector('#photo-scale-output');
const selectedName = document.querySelector('#selected-photo-name');
const statusMessage = document.querySelector('#status-message');

for (let index = 0; index < photoCount; index += 1) {
  const editorCard = editorTemplate.content.cloneNode(true);
  const previewCard = previewTemplate.content.cloneNode(true);
  const upload = editorCard.querySelector('.photo-upload');
  const input = editorCard.querySelector('.photo-input');
  const caption = editorCard.querySelector('.caption-input');
  const previewImage = previewCard.querySelector('.collage-image');
  const previewCaption = previewCard.querySelector('.collage-caption');

  upload.setAttribute('aria-label', `写真 ${index + 1} を選ぶ`);
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      photos[index].src = reader.result;
      photos[index].x = 50;
      photos[index].y = 50;
      photos[index].scale = 100;
      const sourceImage = new Image();
      sourceImage.addEventListener('load', () => {
        photos[index].aspectRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
        applyPhotoPosition(index);
      });
      sourceImage.src = reader.result;
      const thumb = document.createElement('img');
      thumb.className = 'editor-thumbnail';
      thumb.alt = '';
      thumb.src = reader.result;
      upload.replaceChildren(input, thumb);
      upload.classList.add('has-image');
      previewImage.src = reader.result;
      previewImage.classList.add('visible');
      selectPhoto(index);
    });
    reader.readAsDataURL(file);
  });
  upload.addEventListener('click', () => selectPhoto(index));
  caption.addEventListener('input', () => { previewCaption.textContent = caption.value || '説明文を入力'; });
  editorGrid.append(editorCard);
  collageGrid.append(previewCard);
}

function getPreviewImage(index) { return collageGrid.children[index].querySelector('.collage-image'); }
function selectPhoto(index) {
  selectedIndex = index;
  document.querySelectorAll('.photo-upload').forEach((el, i) => el.classList.toggle('is-selected', i === index));
  selectedName.textContent = `写真 ${index + 1}`;
  xSlider.value = photos[index].x;
  ySlider.value = photos[index].y;
  scaleSlider.value = photos[index].scale;
  applyPhotoPosition(index);
  updateSliderOutputs();
}
function applyPhotoPosition(index) {
  const photo = photos[index];
  applyImageLayout(getPreviewImage(index), photo);
  const thumbnail = editorGrid.children[index].querySelector('.editor-thumbnail');
  if (thumbnail) applyImageLayout(thumbnail, photo);
}
function applyImageLayout(image, photo) {
  if (!photo.aspectRatio) return;
  const frame = image.parentElement;
  const frameRatio = frame.clientWidth / frame.clientHeight;
  const coverWidth = photo.aspectRatio > frameRatio ? (photo.aspectRatio / frameRatio) * 100 : 100;
  const coverHeight = photo.aspectRatio > frameRatio ? 100 : (frameRatio / photo.aspectRatio) * 100;
  const width = coverWidth * (photo.scale / 100);
  const height = coverHeight * (photo.scale / 100);
  image.style.width = `${width}%`;
  image.style.height = `${height}%`;
  image.style.left = `${(100 - width) * (photo.x / 100)}%`;
  image.style.top = `${(100 - height) * (photo.y / 100)}%`;
}
function updatePosition() {
  const photo = photos[selectedIndex];
  photo.x = Number(xSlider.value);
  photo.y = Number(ySlider.value);
  applyPhotoPosition(selectedIndex);
  updateSliderOutputs();
}
function updateScale() {
  photos[selectedIndex].scale = Number(scaleSlider.value);
  applyPhotoPosition(selectedIndex);
  updateSliderOutputs();
}
function updateSliderOutputs() {
  xOutput.value = xSlider.value;
  yOutput.value = ySlider.value;
  scaleOutput.value = `${scaleSlider.value}%`;
}

titleInput.addEventListener('input', () => { previewTitle.textContent = titleInput.value || 'タイトルを入力してください'; });
document.querySelectorAll('input[name="font-size"]').forEach((input) => input.addEventListener('change', () => {
  paper.className = `a4-paper size-${input.value}`;
}));
[xSlider, ySlider].forEach((slider) => {
  slider.addEventListener('input', updatePosition);
  slider.addEventListener('change', updatePosition);
});
[scaleSlider].forEach((slider) => {
  slider.addEventListener('input', updateScale);
  slider.addEventListener('change', updateScale);
});
document.querySelector('#reset-position').addEventListener('click', () => { xSlider.value = 50; ySlider.value = 50; updatePosition(); });
document.querySelector('#auto-arrange').addEventListener('click', () => {
  photos.forEach((photo, index) => {
    photo.x = 50; photo.y = 50;
    applyPhotoPosition(index);
  });
  selectPhoto(selectedIndex);
  statusMessage.textContent = '写真を中央に自動配置しました。必要なら下のスライダーで調整できます。';
  window.setTimeout(() => { statusMessage.textContent = ''; }, 3500);
});
selectPhoto(0);
