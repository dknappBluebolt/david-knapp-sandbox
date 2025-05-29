let swipers = [];

document.addEventListener('shopify:section:unload', () => {
  const swiperEls = document.querySelectorAll('.swiper');
  swiperEls.forEach((el) => {
    if(el.swiper){
      swipers.push(el.swiper);
      el.swiper.destroy(false,true);
    }
  });
});

document.addEventListener('shopify:section:load', () => {
  if(swipers.length > 0){
    swipers.forEach((ref) => {
      new Swiper('#'+ref.el.id,ref.passedParams);
    });
  }
});