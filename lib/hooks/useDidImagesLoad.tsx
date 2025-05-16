import React, { Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from 'react';

type DidImagesLoadContextType = {
  didBackgroundLoad: boolean;
  setDidBackgroundLoad: Dispatch<SetStateAction<boolean>>;
  didLogoLoad: boolean;
  setDidLogoLoad: Dispatch<SetStateAction<boolean>>;
  didSongFestivalLoad: boolean;
  setDidSongFestivalLoad: Dispatch<SetStateAction<boolean>>;
};

const DidImagesLoadContext = createContext<DidImagesLoadContextType>({
  didBackgroundLoad: false,
  setDidBackgroundLoad: () => {},
  didLogoLoad: false,
  setDidLogoLoad: () => {},
  didSongFestivalLoad: false,
  setDidSongFestivalLoad: () => {},
});

export const DidImagesLoadProvider = ({ children }: { children: ReactNode }) => {
  const [didBackgroundLoad, setDidBackgroundLoad] = useState(false);
  const [didLogoLoad, setDidLogoLoad] = useState(false);
  const [didSongFestivalLoad, setDidSongFestivalLoad] = useState(false);

  return (
    <DidImagesLoadContext.Provider
      value={{
        didBackgroundLoad,
        setDidBackgroundLoad,
        didLogoLoad,
        setDidLogoLoad,
        didSongFestivalLoad,
        setDidSongFestivalLoad,
      }}
    >
      {children}
    </DidImagesLoadContext.Provider>
  );
};

export const useDidImagesLoad = () => {
  const context = useContext(DidImagesLoadContext);
  if (!context) {
    throw new Error('useDidImagesLoad must be used within a DidImagesLoadProvider');
  }
  return context;
};
