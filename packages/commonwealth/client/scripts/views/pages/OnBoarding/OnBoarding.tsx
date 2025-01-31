import { useCommonNavigate } from 'client/scripts/navigation/helpers';
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
    id: 1,
    title: '',
    animation: animation1,
  },
  {
    id: 2,
    intro: 'Launch',
    title: ' your own coin and share it with friends',
    animation: animation2,
  },
  {
    id: 3,
    intro: ['Buy', 'and', 'sell'],
    title: ' your favourite memes and tokens',
    animation: animation4,
  },
  {
    id: 4,
    intro: 'Earn rewards for every ',
    title: 'post and upvote you create',
    animation: animation3,
  },
];
const OnBoarding = () => {
  const navigate = useCommonNavigate();
  const swiperRef = useRef<SwiperClass>();
  const [isLastSlide, setIsLastSlide] = useState(false);
  const handleNextSlide = () => {
    if (swiperRef.current) {
      if (isLastSlide) {
        navigate(`/discussions`);
      }
      swiperRef.current.slideNext(); // Use slideNext method
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
                className={`slide-title ${slide.id === 4 ? 'top' : 'bottom'}`}
              >
                <CWText
                  type="h2"
                  fontWeight="medium"
                  className="onboarding-title"
                >
                  {Array.isArray(slide.intro) ? (
                    slide.intro.map((word) =>
                      word === 'and' ? (
                        <CWText key={word}> {word} &nbsp;</CWText>
                      ) : (
                        <span key={index} style={{ fontWeight: 'bold' }}>
                          {word}
                        </span>
                      ),
                    )
                  ) : (
                    <span>{slide.intro}</span>
                  )}
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
