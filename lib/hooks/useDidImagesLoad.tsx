import React, { Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from 'react';

type DidImagesLoadContextType = {
  didBackgroundLoad: boolean;
  setDidBackgroundLoad: Dispatch<SetStateAction<boolean>>;
  didLogoLoad: boolean;
  setDidLogoLoad: Dispatch<SetStateAction<boolean>>;
  didWordmarkLoad: boolean;
  setDidWordmarkLoad: Dispatch<SetStateAction<boolean>>;
};

const DidImagesLoadContext = createContext<DidImagesLoadContextType>({
  didBackgroundLoad: false,
  setDidBackgroundLoad: () => {},
  didLogoLoad: false,
  setDidLogoLoad: () => {},
  didWordmarkLoad: false,
  setDidWordmarkLoad: () => {},
});

export const DidImagesLoadProvider = ({ children }: { children: ReactNode }) => {
  const [didBackgroundLoad, setDidBackgroundLoad] = useState(false);
  const [didLogoLoad, setDidLogoLoad] = useState(false);
  const [didWordmarkLoad, setDidWordmarkLoad] = useState(false);

  return (
    <DidImagesLoadContext.Provider
      value={{
        didBackgroundLoad,
        setDidBackgroundLoad,
        didLogoLoad,
        setDidLogoLoad,
        didWordmarkLoad,
        setDidWordmarkLoad,
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
