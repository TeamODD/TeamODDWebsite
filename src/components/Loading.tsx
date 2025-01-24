import { MoonLoader } from "react-spinners";

const Loading = () => {
  const style = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  };

  return (
    <div style={style}>
      <MoonLoader color="#fff" />
    </div>
  );
};

export default Loading;
