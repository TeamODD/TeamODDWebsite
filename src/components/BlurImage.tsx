import { FC, useState } from "react";
import { Blurhash } from "react-blurhash";

import "../styles/BlurImage.css";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const BlurImage: FC<BlurImageProps> = ({
  src,
  alt,
  className,
  placeholder,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`blur-image-wrapper ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`blur-image ${isLoaded ? "visible" : "hidden"}`}
        onLoad={() => setIsLoaded(true)}
      />
      {!isLoaded && (
        <div className="blur-placeholder">
          <Blurhash
            hash={placeholder || "LBD9#MbI00r=W?j[n$ax00n$~pS$"}
            width={"100%"}
            height={"100%"}
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
    </div>
  );
};

export default BlurImage;
