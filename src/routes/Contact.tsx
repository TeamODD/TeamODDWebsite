import "../styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-container">
      <h1 className="contact-title">Contact</h1>

      <div className="contact-grid">
        <div className="contact-section">
          <h2 className="contact-heading">주소</h2>
          <p className="contact-text">
            서울특별시 성북구 삼선교로 16길 116 한성대학교
            <br />
            한성대학교 인성관 508호
          </p>
        </div>

        <div className="contact-section">
          <h2 className="contact-heading">Email</h2>
          <a href="mailto:teamoddhsu@gmail.com" className="contact-link">
            teamoddhsu@gmail.com
          </a>
        </div>

        <div className="contact-section">
          <h2 className="contact-heading">Github</h2>
          <a
            href="https://github.com/TeamODD"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            TeamODD
          </a>
        </div>

        <div className="contact-section">
          <h2 className="contact-heading">Instagram</h2>
          <a
            href="https://instagram.com/teamodd_hansunguniv"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            @teamodd_hansunguniv
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;
