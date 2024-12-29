import { useEffect, useState } from "react";
import "../styles/BlurImage.css";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
}

const BlurImage = ({ src, alt, className }: BlurImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState("");

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoading(false);
      setCurrentSrc(src);
    };
  }, [src]);

  return (
    <div className={`blur-image-wrapper ${isLoading ? "loading" : ""}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`blur-image ${className || ""}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default BlurImage;
