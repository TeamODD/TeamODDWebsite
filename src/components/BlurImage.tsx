import { FC, useState } from "react";
import { Blurhash } from "react-blurhash";

import "../styles/BlurImage.css";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

/**
 * BlurImage 컴포넌트는 이미지가 로드될 때까지 블러 해시를 사용하여
 * 자리 표시자 이미지를 보여줍니다.
 *
 * @param {string} src - 로드할 이미지의 소스 URL.
 * @param {string} alt - 이미지의 대체 텍스트.
 * @param {string} className - 추가할 CSS 클래스 이름.
 * @param {string} placeholder - 블러 해시 자리 표시자 값.
 *
 * @returns {JSX.Element} BlurImage 컴포넌트.
 */
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
