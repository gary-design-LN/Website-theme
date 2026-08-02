if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
        this.zoomLevel = 1;
        this.mediaItems = [];

        const controls = this.querySelector('.product-media-modal__controls');
        if (controls) {
          // Dawn closes media modals when a mouse pointer is released outside
          // deferred media. Keep control interactions from reaching that handler.
          controls.addEventListener('pointerup', (event) => event.stopPropagation());
          controls.addEventListener('click', (event) => event.stopPropagation());

          controls.addEventListener('click', (event) => {
            const navButton = event.target.closest('.product-media-modal__nav');
            if (navButton) {
              this.showRelativeMedia(navButton.classList.contains('product-media-modal__nav--next') ? 1 : -1);
              return;
            }

            const zoomButton = event.target.closest('[data-zoom-action]');
            if (zoomButton) this.changeZoom(zoomButton.dataset.zoomAction);
          });
        }

        this.addEventListener('wheel', (event) => {
          if (!this.hasAttribute('open') || !this.getActiveImage()) return;
          event.preventDefault();
          this.setZoom(this.zoomLevel + (event.deltaY < 0 ? 0.25 : -0.25));
        }, { passive: false });

        this.addEventListener('dblclick', (event) => {
          if (event.target === this.getActiveImage()) this.setZoom(this.zoomLevel > 1 ? 1 : 2);
        });

        this.handleGalleryKeys = this.handleGalleryKeys.bind(this);
      }

      hide() {
        document.removeEventListener('keydown', this.handleGalleryKeys);
        this.resetZoom();
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.mediaItems = Array.from(this.querySelectorAll('.product-media-modal__content > [data-media-id]'));
        this.showActiveMedia(opener.getAttribute('data-media-id'));
        document.addEventListener('keydown', this.handleGalleryKeys);
      }

      handleGalleryKeys(event) {
        if (event.key === 'ArrowRight') this.showRelativeMedia(1);
        if (event.key === 'ArrowLeft') this.showRelativeMedia(-1);
        if (event.key === '+' || event.key === '=') this.changeZoom('in');
        if (event.key === '-') this.changeZoom('out');
        if (event.key === '0') this.changeZoom('reset');
      }

      showActiveMedia(mediaId) {
        if (!mediaId) return;

        this.mediaItems.forEach((element) => {
          element.classList.toggle('active', element.getAttribute('data-media-id') === mediaId);
        });

        const activeMedia = this.getActiveMedia();
        if (!activeMedia) return;

        const activeMediaTemplate = activeMedia.querySelector('template');
        const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
        this.resetZoom();
        activeMedia.scrollIntoView({ block: 'center', inline: 'center' });

        if (
          activeMedia.nodeName === 'DEFERRED-MEDIA' &&
          activeMediaContent &&
          activeMediaContent.querySelector('.js-youtube')
        ) activeMedia.loadContent();
      }

      showRelativeMedia(direction) {
        if (!this.mediaItems.length) return;
        const currentIndex = this.mediaItems.indexOf(this.getActiveMedia());
        const nextIndex = (currentIndex + direction + this.mediaItems.length) % this.mediaItems.length;
        this.showActiveMedia(this.mediaItems[nextIndex].getAttribute('data-media-id'));
      }

      getActiveMedia() {
        return this.querySelector('.product-media-modal__content > .active');
      }

      getActiveImage() {
        const activeMedia = this.getActiveMedia();
        return activeMedia && activeMedia.tagName === 'IMG' ? activeMedia : null;
      }

      changeZoom(action) {
        if (action === 'in') this.setZoom(this.zoomLevel + 0.25);
        if (action === 'out') this.setZoom(this.zoomLevel - 0.25);
        if (action === 'reset') this.setZoom(1);
      }

      setZoom(level) {
        const image = this.getActiveImage();
        if (!image) return;
        this.zoomLevel = Math.min(4, Math.max(0.5, level));
        image.style.transform = `scale(${this.zoomLevel})`;
        image.style.cursor = this.zoomLevel > 1 ? 'zoom-out' : 'zoom-in';
        const resetButton = this.querySelector('[data-zoom-action="reset"]');
        if (resetButton) resetButton.textContent = `${Math.round(this.zoomLevel * 100)}%`;
      }

      resetZoom() {
        this.querySelectorAll('.product-media-modal__content > img').forEach((image) => {
          image.style.transform = '';
          image.style.cursor = 'zoom-in';
        });
        this.zoomLevel = 1;
        const resetButton = this.querySelector('[data-zoom-action="reset"]');
        if (resetButton) resetButton.textContent = '100%';
      }
    }
  );
}
