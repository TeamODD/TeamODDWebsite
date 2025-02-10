import "../styles/GradientButton.css";

interface GradientButtonProps {
  innerText: string;
  className?: string;
  onClick: () => void;
}

const GradientButton = (props: GradientButtonProps) => {
  return (
    <button className="gradient-button" onClick={props.onClick}>
      {props.innerText}
    </button>
  );
};

export default GradientButton;
