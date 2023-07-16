import React, { useState, useEffect, useRef } from 'react';
import { SnapshotProposalCard } from '../../snapshot_proposals/snapshot_proposal_card';
import 'components/ProposalCard/ProposalCard.scss';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';

import './index.scss';
import useBrowserWindow from 'hooks/useBrowserWindow';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from 'views/components/component_kit/helpers';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';

export const CardCarousel = ({ fetchActiveProposals }) => {
  const [currentProposalsIdx, setCurrentProposalsIdx] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);
  const [cardsPosition, setCardsPosition] = useState(0);
  const [activeProposals, setActiveProposals] = useState<
    Array<SnapshotProposal>
  >([]);

  useEffect(() => {
    fetchActiveProposals().then((fetchedActiveProposals) => {
      setActiveProposals(fetchedActiveProposals);
    });
  }, [fetchActiveProposals]);

  const proposalCardsRowRef = useRef(null);
  const cardCarouselRef = useRef(null);

  // Add this function inside the component
  const updateIsCollapsedSize = () => {
    if (!cardCarouselRef.current || !proposalCardsRowRef.current) return;

    const cardCarouselWidth = cardCarouselRef.current.offsetWidth;
    const isCardCarouselWidthExceeded =
      cardCarouselWidth * 0.85 < proposalCardsRowRef.current.scrollWidth;

    breakpointFnValidator(
      isCardCarouselWidthExceeded,
      (state: boolean) => {
        setIsCollapsedSize(state);
      },
      isWindowMediumSmallInclusive
    );
  };

  useEffect(() => {
    // Call the function on initial render
    if (cardCarouselRef.current && proposalCardsRowRef.current) {
      updateIsCollapsedSize();
    }

    // Listen for changes in device size
    const mediaQueryList = window.matchMedia('(max-width: 768px)');
    const handleDeviceSizeChange = (event) => {
      if (event.matches) {
        updateIsCollapsedSize();
      }
    };

    mediaQueryList.addListener(handleDeviceSizeChange);

    return () => {
      mediaQueryList.removeListener(handleDeviceSizeChange);
    };
  }, [cardCarouselRef, proposalCardsRowRef]); // Add these dependencies

  // Call the function on window resize
  useBrowserWindow({
    onResize: () => updateIsCollapsedSize(),
    resizeListenerUpdateDeps: [isCollapsedSize],
  });

  useEffect(() => {
    setShowLeftArrow(currentProposalsIdx > 0);
    setShowRightArrow(currentProposalsIdx + 3 < activeProposals.length);
  }, [currentProposalsIdx, activeProposals.length]);

  const moveLeft = () => {
    if (currentProposalsIdx > 0) {
      setCurrentProposalsIdx(currentProposalsIdx - 1);
      setCardsPosition(cardsPosition + 50);
    }
  };

  const moveRight = () => {
    if (currentProposalsIdx + 3 < activeProposals.length) {
      setCurrentProposalsIdx(currentProposalsIdx + 1);
      setCardsPosition(cardsPosition - 50);
    }
  };

  console.log('activeProposals', activeProposals);

  return (
    <div
      className={`CardCarousel ${isCollapsedSize ? 'small-screen' : ''}`}
      ref={cardCarouselRef}
    >
      <div
        className="proposal-cards-row"
        style={{ transform: `translateX(${cardsPosition}%)` }}
      >
        {activeProposals
          .slice(currentProposalsIdx, currentProposalsIdx + 3)
          .map((proposalData, index) => (
            <SnapshotProposalCard
              key={index}
              snapshotId={proposalData.snapshot}
              proposal={proposalData}
            />
          ))}
      </div>
      {showLeftArrow && (
        <button className="arrow left-arrow" onClick={moveLeft}>
          <CWIcon iconName="arrowLeft" iconSize="medium" />
        </button>
      )}
      {showRightArrow && (
        <button
          className={`arrow right-arrow ${
            isCollapsedSize ? 'small-screen' : ''
          }`}
          onClick={moveRight}
        >
          <CWIcon iconName="arrowRight" iconSize="medium" />
        </button>
      )}
    </div>
  );
};
