type IconImageProps = {
  src: string;
  size?: number;
  alt?: string;
  className?: string;
};

export default function IconImage({
  src,
  size = 22,
  alt = "",
  className = "",
}: IconImageProps) {
  return (

    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`block shrink-0 ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
