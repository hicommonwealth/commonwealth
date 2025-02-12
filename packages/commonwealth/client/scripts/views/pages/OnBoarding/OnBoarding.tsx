import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import clsx from 'clsx';
import Lottie from 'lottie-react';
import React, { useRef, useState } from 'react';
import 'swiper/css';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper/types';
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
    id: 1,
    title: '',
    animation: animation1,
  },
  {
    id: 2,
    animation: animation2,
    text: (
      <CWText type="h2" fontWeight="medium" className="onboarding-title">
        <span style={{ fontWeight: 'bold' }}>Launch</span>&nbsp;a coin and
        <span style={{ fontWeight: 'bold' }}> grow</span>&nbsp;it with friends.
      </CWText>
    ),
  },
  {
    id: 3,
    animation: animation4,
    text: (
      <CWText type="h2" fontWeight="medium" className="onboarding-title">
        <span style={{ fontWeight: 'bold' }}>Buy</span>&nbsp;and
        <span style={{ fontWeight: 'bold' }}> sell</span>&nbsp;your favourite
        memes and tokens.
      </CWText>
    ),
  },
  {
    id: 4,
    animation: animation3,
    text: (
      <CWText type="h2" fontWeight="medium" className="onboarding-title">
        Every <span style={{ fontWeight: 'bold' }}>post</span>&nbsp;is a chance
        to <span style={{ fontWeight: 'bold' }}>win</span>&nbsp;real money.
      </CWText>
    ),
  },
];
const OnBoarding = () => {
  const navigate = useCommonNavigate();
  const swiperRef = useRef<SwiperClass>();
  const [isLastSlide, setIsLastSlide] = useState(false);
  const handleNextSlide = () => {
    if (swiperRef.current) {
      if (isLastSlide) {
        navigate(`/dashboard/global?openAuthModal=true`);
      }
      swiperRef.current.slideNext();
    }
  };
  const handleSlideChange = () => {
    if (swiperRef.current) {
      const swiper = swiperRef.current;
      const isLast = swiper.activeIndex === swiper.slides.length - 1;
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
                  loop={true}
                  autoPlay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div
                className={clsx(
                  'slide-title',
                  slide.id !== 1 ? 'top' : 'bottom',
                )}
              >
                {slide?.text}
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
