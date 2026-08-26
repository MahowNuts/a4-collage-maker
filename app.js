const photoCount = 6;
const photos = Array.from({ length: photoCount }, () => ({ src: '', x: 50, y: 50, scale: 100, aspectRatio: null }));
let selectedIndex = 0;
let activePhotoCount = 6;
let activeTemplate = '6';
let previewDrag = null;
const templateConfig = {
  '6': { photoCount: 6, paperClass: 'template-6' },
  '4': { photoCount: 4, paperClass: 'template-4' },
  'portrait-4': { photoCount: 4, paperClass: 'template-portrait-4' },
  '2': { photoCount: 2, paperClass: 'template-2' },
  'portrait-2': { photoCount: 2, paperClass: 'template-portrait-2' },
};

const editorGrid = document.querySelector('#photo-editor-grid');
const collageGrid = document.querySelector('#collage-grid');
const editorTemplate = document.querySelector('#editor-card-template');
const previewTemplate = document.querySelector('#preview-card-template');
const titleInput = document.querySelector('#title-input');
const previewTitle = document.querySelector('#preview-title');
const paper = document.querySelector('#a4-paper');
const statusMessage = document.querySelector('#status-message');

for (let index = 0; index < photoCount; index += 1) {
  const editorCard = editorTemplate.content.cloneNode(true);
  const previewCard = previewTemplate.content.cloneNode(true);
  const upload = editorCard.querySelector('.photo-upload');
  const input = editorCard.querySelector('.photo-input');
  const removeButton = editorCard.querySelector('.photo-remove-button');
  const caption = editorCard.querySelector('.caption-input');
  const previewImage = previewCard.querySelector('.collage-image');
  const previewCaption = previewCard.querySelector('.collage-caption');
  const previewFrame = previewCard.querySelector('.image-frame');

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
      removeButton.hidden = false;
      removeButton.disabled = false;
      previewImage.src = reader.result;
      previewImage.classList.add('visible');
      previewImage.closest('.collage-item').classList.add('has-image');
      selectPhoto(index);
    });
    reader.readAsDataURL(file);
  });
  upload.addEventListener('click', () => selectPhoto(index));
  removeButton.addEventListener('click', () => resetPhoto(index));
  caption.addEventListener('input', () => { previewCaption.textContent = caption.value || '説明文を入力'; });
  previewFrame.addEventListener('pointerdown', (event) => beginPreviewDrag(event, index, previewFrame));
  previewFrame.addEventListener('pointermove', (event) => movePreviewDrag(event, previewFrame));
  previewFrame.addEventListener('pointerup', (event) => endPreviewDrag(event, previewFrame));
  previewFrame.addEventListener('pointercancel', (event) => endPreviewDrag(event, previewFrame));
  editorGrid.append(editorCard);
  collageGrid.append(previewCard);
}

function getPreviewImage(index) { return collageGrid.children[index].querySelector('.collage-image'); }
function resetPhoto(index) {
  const photo = photos[index];
  const editorCard = editorGrid.children[index];
  const upload = editorCard.querySelector('.photo-upload');
  const input = editorCard.querySelector('.photo-input');
  const removeButton = editorCard.querySelector('.photo-remove-button');
  const previewImage = getPreviewImage(index);
  photo.src = '';
  photo.x = 50;
  photo.y = 50;
  photo.scale = 100;
  photo.aspectRatio = null;
  input.value = '';
  const uploadIcon = document.createElement('span');
  uploadIcon.className = 'upload-icon';
  uploadIcon.setAttribute('aria-hidden', 'true');
  uploadIcon.textContent = '＋';
  const uploadLabel = document.createElement('span');
  uploadLabel.className = 'upload-label';
  uploadLabel.textContent = '写真を選ぶ';
  upload.replaceChildren(input, uploadIcon, uploadLabel);
  upload.classList.remove('has-image');
  removeButton.hidden = true;
  removeButton.disabled = true;
  previewImage.removeAttribute('src');
  previewImage.classList.remove('visible');
  previewImage.closest('.collage-item').classList.remove('has-image');
  previewImage.removeAttribute('style');
  selectPhoto(index);
}
function selectPhoto(index) {
  if (index >= activePhotoCount) return;
  selectedIndex = index;
  document.querySelectorAll('.photo-upload').forEach((el, i) => el.classList.toggle('is-selected', i === index));
  Array.from(collageGrid.children).forEach((el, i) => el.classList.toggle('is-selected', i === index));
  applyPhotoPosition(index);
}
function applyPaperClasses() {
  const selectedSize = document.querySelector('input[name="font-size"]:checked').value;
  paper.className = `a4-paper size-${selectedSize} ${templateConfig[activeTemplate].paperClass}`;
}
function setTemplate(template) {
  activeTemplate = template;
  activePhotoCount = templateConfig[activeTemplate].photoCount;
  document.body.dataset.template = activeTemplate;
  Array.from(editorGrid.children).forEach((card, index) => card.classList.toggle('is-template-hidden', index >= activePhotoCount));
  Array.from(collageGrid.children).forEach((card, index) => card.classList.toggle('is-template-hidden', index >= activePhotoCount));
  applyPaperClasses();
  for (let index = 0; index < activePhotoCount; index += 1) applyPhotoPosition(index);
  selectPhoto(selectedIndex < activePhotoCount ? selectedIndex : 0);
}
function applyPhotoPosition(index) {
  const photo = photos[index];
  applyImageLayout(getPreviewImage(index), photo);
  const thumbnail = editorGrid.children[index].querySelector('.editor-thumbnail');
  if (thumbnail) applyImageLayout(thumbnail, photo);
}
function getImageDimensions(image, photo) {
  const frame = image.parentElement;
  const frameRatio = frame.clientWidth / frame.clientHeight;
  const coverWidth = photo.aspectRatio > frameRatio ? (photo.aspectRatio / frameRatio) * 100 : 100;
  const coverHeight = photo.aspectRatio > frameRatio ? 100 : (frameRatio / photo.aspectRatio) * 100;
  return {
    width: coverWidth * (photo.scale / 100),
    height: coverHeight * (photo.scale / 100),
  };
}
function applyImageLayout(image, photo) {
  if (!photo.aspectRatio) return;
  const { width, height } = getImageDimensions(image, photo);
  image.style.width = `${width}%`;
  image.style.height = `${height}%`;
  image.style.left = `${(100 - width) * (photo.x / 100)}%`;
  image.style.top = `${(100 - height) * (photo.y / 100)}%`;
}
function clampPosition(value) { return Math.max(0, Math.min(100, Math.round(value))); }
function clampScale(value) { return Math.max(50, Math.min(150, Math.round(value))); }
function getPinchDistance(pointers) {
  const [first, second] = Array.from(pointers.values());
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}
function setMoveBaseline() {
  const [pointerId, pointer] = previewDrag.pointers.entries().next().value;
  previewDrag.mode = 'move';
  previewDrag.startPointerId = pointerId;
  previewDrag.startClientX = pointer.clientX;
  previewDrag.startClientY = pointer.clientY;
  previewDrag.startX = photos[previewDrag.index].x;
  previewDrag.startY = photos[previewDrag.index].y;
}
function activatePinch() {
  previewDrag.mode = 'pinch';
  previewDrag.startPinchDistance = getPinchDistance(previewDrag.pointers);
  previewDrag.startScale = photos[previewDrag.index].scale;
}
function beginPreviewDrag(event, index, frame) {
  selectPhoto(index);
  if (!photos[index].src || !photos[index].aspectRatio || (event.pointerType === 'mouse' && event.button !== 0)) return;
  if (!previewDrag || previewDrag.index !== index) {
    previewDrag = { index, pointers: new Map(), mode: 'move' };
    frame.closest('.collage-item').classList.add('is-dragging');
  }
  previewDrag.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
  frame.setPointerCapture?.(event.pointerId);
  if (previewDrag.pointers.size === 1) setMoveBaseline();
  if (previewDrag.pointers.size === 2) activatePinch();
  event.preventDefault();
}
function movePreviewDrag(event, frame) {
  if (!previewDrag || !previewDrag.pointers.has(event.pointerId)) return;
  previewDrag.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
  const photo = photos[previewDrag.index];
  if (previewDrag.mode === 'pinch' && previewDrag.pointers.size >= 2) {
    const scaleFactor = getPinchDistance(previewDrag.pointers) / previewDrag.startPinchDistance;
    photo.scale = clampScale(previewDrag.startScale * scaleFactor);
    applyPhotoPosition(previewDrag.index);
    event.preventDefault();
    return;
  }
  const image = getPreviewImage(previewDrag.index);
  const { width, height } = getImageDimensions(image, photo);
  const frameRect = frame.getBoundingClientRect();
  const moveX = event.clientX - previewDrag.startClientX;
  const moveY = event.clientY - previewDrag.startClientY;
  const horizontalRoom = 100 - width;
  const verticalRoom = 100 - height;
  if (horizontalRoom !== 0) photo.x = clampPosition(previewDrag.startX + ((moveX / frameRect.width) * 10000) / horizontalRoom);
  if (verticalRoom !== 0) photo.y = clampPosition(previewDrag.startY + ((moveY / frameRect.height) * 10000) / verticalRoom);
  applyPhotoPosition(previewDrag.index);
  event.preventDefault();
}
function endPreviewDrag(event, frame) {
  if (!previewDrag || !previewDrag.pointers.has(event.pointerId)) return;
  previewDrag.pointers.delete(event.pointerId);
  if (frame.hasPointerCapture?.(event.pointerId)) frame.releasePointerCapture(event.pointerId);
  if (previewDrag.pointers.size === 1) setMoveBaseline();
  if (previewDrag.pointers.size === 0) {
    frame.closest('.collage-item').classList.remove('is-dragging');
    previewDrag = null;
  }
  event.preventDefault();
}
titleInput.addEventListener('input', () => { previewTitle.textContent = titleInput.value || 'タイトルを入力してください'; });
document.querySelectorAll('input[name="font-size"]').forEach((input) => input.addEventListener('change', () => {
  applyPaperClasses();
}));
document.querySelectorAll('input[name="template"]').forEach((input) => {
  const applySelectedTemplate = () => {
    if (input.checked) setTemplate(input.value);
  };
  input.addEventListener('click', applySelectedTemplate);
  input.addEventListener('input', applySelectedTemplate);
  input.addEventListener('change', applySelectedTemplate);
});
document.querySelector('#auto-arrange').addEventListener('click', () => {
  photos.slice(0, activePhotoCount).forEach((photo, index) => {
    photo.x = 50; photo.y = 50;
    applyPhotoPosition(index);
  });
  selectPhoto(selectedIndex);
  statusMessage.textContent = '写真を中央に自動配置しました。必要ならプレビュー上で調整できます。';
  window.setTimeout(() => { statusMessage.textContent = ''; }, 3500);
});
setTemplate(activeTemplate);
