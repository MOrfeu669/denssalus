type IconeProps = { cor?: string };

export function IconeDente() {
  return (
    <svg width="16.9" height="18.96" viewBox="-0.817 -0.812 16.9 18.958" aria-hidden="true">
      <path
        fill="#158172"
        d="M7.633 1.354C6.008-0.271 2.217-0.812 0.592 1.896C-0.817 4.279 0.592 7.313 1.675 10.021C2.758 12.729 2.758 17.062 4.383 17.604C6.008 18.146 6.333 13.813 7.633 13.813C8.933 13.813 9.258 18.146 10.883 17.604C12.508 17.062 12.508 12.729 13.592 10.021C14.675 7.313 16.083 4.279 14.675 1.896C13.05-0.812 9.258-0.271 7.633 1.354Z"
      />
    </svg>
  );
}

export function IconeOk({ cor = "#3FBBA8" }: IconeProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.333" fill="none" stroke={cor} strokeWidth="1.667" />
      <path
        d="M7.5 10.2 L9.2 11.9 L12.6 8.2"
        fill="none"
        stroke={cor}
        strokeWidth="1.667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeErro() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.333" fill="none" stroke="#D4372C" strokeWidth="1.667" />
      <path
        d="M7.5 7.5 L12.5 12.5 M12.5 7.5 L7.5 12.5"
        fill="none"
        stroke="#D4372C"
        strokeWidth="1.667"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeEscudo() {
  return (
    <svg width="10.667" height="13.336" viewBox="0 0 16 20" aria-hidden="true">
      <path
        d="M8 1.2 L14.2 3.6 V10.2 C14.2 14.2 11.4 17.2 8 18.6 C4.6 17.2 1.8 14.2 1.8 10.2 V3.6 Z"
        fill="none"
        stroke="#64747E"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect
        x="1.5"
        y="3"
        width="15"
        height="12"
        rx="1.5"
        fill="none"
        stroke="#64747E"
        strokeWidth="1.5"
      />
      <path
        d="M2.2 4.4 L9 9.1 L15.8 4.4"
        fill="none"
        stroke="#64747E"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeCadeado() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect
        x="2.25"
        y="8.25"
        width="13.5"
        height="8.25"
        rx="1.5"
        fill="none"
        stroke="#64747E"
        strokeWidth="1.5"
      />
      <path
        d="M5.25 8.25 V6.1 a3.75 3.75 0 0 1 7.5 0 V8.25"
        fill="none"
        stroke="#64747E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeOlho() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M1.5 9 C3.6 5.6 14.4 5.6 16.5 9 C14.4 12.4 3.6 12.4 1.5 9 Z"
        fill="none"
        stroke="#64747E"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.25" fill="none" stroke="#64747E" strokeWidth="1.5" />
    </svg>
  );
}
