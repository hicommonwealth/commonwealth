import Lottie from 'lottie-react';
import React, { useRef, useState } from 'react';
import 'swiper/css';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper/types'; // Import Swiper type
import animation1 from '../../../../assets/animation/onboarding_1.json';
import animation2 from '../../../../assets/animation/onboarding_2.json';
import animation3 from '../../../../assets/animation/onboarding_3.json';
import animation4 from '../../../../assets/animation/onboarding_4.json';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import './OnBoarding.scss';
const slides = [
  {
    title: '',
    animation: animation1,
  },
  {
    intro: 'Launch',
    title: ' your own coin and grow it with friends',
    animation: animation2,
  },
  {
    intro: 'Earn rewards for every',
    title: 'post and upvote you create',
    animation: animation3,
  },
  {
    intro: 'Buy, sell, and follow',
    title: 'memes and tokens you like',
    animation: animation4,
  },
];
const OnBoarding = () => {
  const swiperRef = useRef<SwiperClass>();
  const [isLastSlide, setIsLastSlide] = useState(false);
  const handleNextSlide = () => {
    console.log('qwerty', swiperRef);
    if (swiperRef.current) {
      if (isLastSlide) {
        alert('hello');
      }
      swiperRef.current.slideNext(); // Use slideNext method
    }
  };
  const handleSlideChange = () => {
    if (swiperRef.current) {
      const swiper = swiperRef.current;
      const isLast = swiper.activeIndex === swiper.slides.length - 1; // Check if it's the last slide
      setIsLastSlide(isLast);
    }
  };
  return (
    <CWPageLayout className="OnBoarding">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={handleSlideChange}
        modules={[Pagination]}
        spaceBetween={50}
        slidesPerView={1}
        pagination={{
          clickable: true,
        }}
        className="swiper-container"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="slide-content">
              <div className="animation-container">
                <Lottie
                  animationData={slide.animation}
                  loop={true} // Enable looping if desired
                  autoPlay={true} // Automatically start the animation
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div className="slide-title">
                <CWText
                  type="h2"
                  fontWeight="medium"
                  className="onboarding-title"
                >
                  <span>{slide.intro}</span>
                  {slide.title}
                </CWText>
              </div>
            </div>
          </SwiperSlide>
        ))}

        <CWButton
          buttonType="primary"
          label="Next"
          onClick={handleNextSlide}
          containerClassName="next-button"
          buttonWidth="full"
        />
      </Swiper>
    </CWPageLayout>
  );
};

export default OnBoarding;
