"use client";

import {
  createContext,
  useContext,
  useState,
  type AnimationEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import heroStyles from "./Hero.module.css";
import styles from "./LotteWalker.module.css";

const LotteTriggerContext = createContext<(() => void) | null>(null);

export function LotteWalkerProvider({ children }: { children: ReactNode }) {
  const [isWalking, setIsWalking] = useState(false);
  const [walkKey, setWalkKey] = useState(0);

  function trigger() {
    setIsWalking(true);
    // Cambiar la key fuerza a React a desmontar y volver a montar el div,
    // reiniciando la animación CSS desde el principio incluso si ya estaba
    // corriendo — equivalente al truco de "remove class, forzar reflow,
    // volver a agregar la class" del mockup original.
    setWalkKey((key) => key + 1);
  }

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    // El único animationend que puede llegar hasta acá es el de walkAcross:
    // todas las demás animaciones (patas, cola, oreja, ojo) son "infinite" y
    // por definición nunca disparan animationend, así que no hace falta
    // filtrar por nombre de animación (que además vendría con el hash que le
    // pone CSS Modules, no el nombre literal del @keyframes).
    if (event.target === event.currentTarget) {
      setIsWalking(false);
    }
  }

  return (
    <LotteTriggerContext.Provider value={trigger}>
      {children}
      <div
        key={walkKey}
        onAnimationEnd={handleAnimationEnd}
        aria-hidden="true"
        className={`${styles.lotteWalker} ${isWalking ? styles.active : ""}`}
      >
        <svg
          className={styles.lotteSvg}
          viewBox="0 0 1057 843"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <g className={styles.lotteBob}>
            <g
              className={`${styles.part} ${styles.body}`}
              transform="translate(0,112)"
            >
              <path
                d="M812.5 100.847L737.5 0.84668L735 4.34668H730L723 7.84668L716 16.8467L712 26.8467L696 30.8467L685 39.3467L680.5 46.8467L670 44.3467H657.5L646.5 46.8467L636 52.8467L627 48.3467L616.5 44.3467H588L568.5 50.8467L561 48.3467L550.5 44.3467H529L517 48.3467L508 42.3467L485 33.8467H462.5L452.5 37.3467L433 27.8467H415L397.5 31.3467L384 23.8467L370 18.8467H355.5H348.5H340.5L326 23.8467L321 20.8467L314 18.8467L307 16.3467L300.5 15.3467L287.5 16.3467H272.5L255 23.8467L244 20.8467H234.5L217 23.8467L206.5 27.8467L193 38.3467H174.5L164.5 40.8467L147.5 48.8467L133 63.3467H129L115 66.3467L103.5 73.8467L91 84.8467L83 97.3467L80 101.347L71.5 105.347L59.5 112.847L50 123.347L41.5 136.847L38 153.847L32.5 158.847L23 167.347L13 187.347L10.5 199.847L13 215.347L5.5 229.347L0.5 243.347V258.347L8 270.847L5.5 276.347L4 282.347V296.347L8 304.347L15 314.847L20.5 318.847V326.847L23 332.847L28 340.847L34.5 346.347L45.5 349.347L56 347.847L59.5 354.847L63.5 367.347L73.5 379.847L71.5 392.347L73.5 404.847L83.5 416.347V426.847V432.347L94.5 447.847L204.5 452.347L218.5 443.847L224 438.347L231 424.347L237 421.847L246 413.847L253 404.847L259 408.847L267.5 410.347H276L287.5 418.847L294 421.847H299.5L312.5 424.347L316 426.847L324 432.347L335 436.347L341.5 438.347H353L362.5 436.347L368 440.847L386.5 446.847H405.5L423.5 440.847L432 446.847L450.5 449.347L464.5 447.847L478 442.347L486.5 444.847L494 447.847L512 444.847L522 439.347L532.5 442.347H545.5L554.5 436.347L559 439.347L568 440.847H578.5H698L703.5 443.347H711.5L719.5 442.347L728 438.347H731L740 439.347L752 438.347L756.5 436.347L762.5 432.347L768 427.347H777.5L788 422.847L800.5 412.347L806 398.847H811L818.5 395.347L831 386.847L838.5 376.347L843 358.847L848 356.347L857 347.847L864.5 337.347L868.5 315.847L875 310.847L881 303.347L888.5 283.347V263.847L898.5 254.347L903 245.847L905.5 232.347V216.347L914.5 205.847L918.5 194.847L922 181.847L918.5 163.347L928 148.347L930 130.347L812.5 100.847Z"
                stroke="black"
              />
            </g>
            <g
              className={`${styles.part} ${styles.bodyCurls}`}
              transform="translate(109,178)"
            >
              <path
                d="M621.5 0.139648L618 12.1396L621.5 20.1396L627 26.6396L631.5 30.6396"
                stroke="black"
              />
              <path
                d="M653.5 41.6396L651 50.6396L656 57.1396L661 60.6396L665.5 69.1396L676.5 75.1396"
                stroke="black"
              />
              <path
                d="M710.5 87.1396L714.5 98.1396L725.5 103.14L732.5 109.14H743L744.5 105.14"
                stroke="black"
              />
              <path
                d="M704 163.14L709.5 176.64L721.5 180.14L729 184.64H734.5H741"
                stroke="black"
              />
              <path
                d="M541 73.6396L537 86.1396L541 95.6396L545 101.14L549.5 105.14V109.64L556 115.14H560.5"
                stroke="black"
              />
              <path
                d="M590.5 217.64V231.64L598 237.64H602L606 244.14L613 246.64"
                stroke="black"
              />
              <path
                d="M25 58.6396L14.5 62.1396L10 70.6396V74.6396L0.5 82.6396V89.6396V99.1396"
                stroke="black"
              />
              <path
                d="M124.5 106.14L116.5 116.64V129.64L120 138.14V146.64L124.5 151.64"
                stroke="black"
              />
              <path
                d="M43.5 218.64L41.5 230.14L43.5 240.14L52.5 243.64L55 251.14L63.5 253.64"
                stroke="black"
              />
              <path
                d="M256 305.14L259 314.64L265 323.14H270L276.5 328.64H285.5"
                stroke="black"
              />
              <path
                d="M173 219.14L166.5 232.64L169.5 243.64L173 245.14V253.14L180 257.14"
                stroke="black"
              />
              <path
                d="M308.5 166.14L304 179.14L306.5 191.64L311 198.14H317.5L319 206.64L324 210.64H331.5"
                stroke="black"
              />
              <path
                d="M456.5 251.14L452.5 261.64V270.64L456.5 276.64V282.64L464 289.64"
                stroke="black"
              />
            </g>
            <g transform="translate(717,40)">
              <g className={`${styles.part} ${styles.ear}`}>
                <path d="M114 45.0039L100 37.5039L91 28.0039L79.5 20.5039L71.5 18.0039L17.5 20.5039L25.5 22.0039H43.5H56.5V23.5039L47 26.0039L68.5 25.0039L70.5 27.0039L47 32.0039L67.5 29.5039L72.5 29.0039L76 29.5039L76.5 31.0039L73.5 32.0039L53 38.0039L73 34.5039L76 35.0039L77.5 36.0039L79.5 37.0039V39.0039L76 40.5039L68.5 42.5039L62 43.5039L49.5 45.0039L56 45.5039L61 45.0039L68.5 44.0039L73.5 43.5039L78.5 42.0039L81 41.0039L83 42.5039V44.0039L78 45.0039L72.5 46.0039L70 47.0039L80 46.5039L84 45.5039L87 45.0039L88.5 46.5039L64 53.5039H70.5L80 50.5039L86 49.0039L90 48.0039L92 49.0039L92.5 49.5039L89.5 50.5039L86 52.5039L71.5 56.5039L87 54.5039L94.5 51.5039L99.5 50.0039H106M118.5 18.0039L112.5 16.5039L71.5 0.503906L34.5 2.00391L13 6.50391L7 9.00391L0.5 15.0039V23.5039L8.5 37.5039L22 52.0039L40 63.5039L56.5 71.0039L67.5 72.5039H76H87L96.5 69.5039L102 66.5039L106.5 63.5039V61.0039L118.5 47.5039V18.0039Z" />
                <path d="M106 50.0039L114 45.0039" />
              </g>
            </g>
            <g transform="translate(885,96)">
              <g className={`${styles.part} ${styles.eye}`}>
                <path d="M8.20044 10.5161H0.200439L8.20044 14.0161L12.7004 19.5161L17.2004 25.5161L26.7004 28.0161H34.2004L41.2004 25.5161L48.2004 30.5161L52.2004 33.0161L50.2004 28.0161L45.2004 18.0161L41.2004 10.5161L36.7004 3.51611L29.2004 0.516113L20.2004 2.01611L8.20044 10.5161Z" />
              </g>
            </g>
            <g
              className={`${styles.part} ${styles.nose}`}
              transform="translate(977,184)"
            >
              <path
                d="M56.5 45H51.5H34.5L23.5 42L10.5 36.5L3 31L0.5 28.5V26.5L10.5 31L23.5 36.5L30.5 40H37H51.5L59 38.5L64 34.5L68.5 28.5V22L66 15.5L59 11.5L50 9.5L44.5 4.5V0.5H50L55 3L59 4.5L66 6.5L72 13.5L74 19.5"
                stroke="black"
              />
            </g>
            <g
              className={`${styles.part} ${styles.cheek}`}
              transform="translate(839,161)"
            >
              <path
                d="M0.5 0V12.5L7.5 29.5L18.5 44.5L36.5 57.5"
                stroke="black"
              />
            </g>
            <g
              className={`${styles.part} ${styles.eyebrowns}`}
              transform="translate(859,54)"
            >
              <path
                d="M3.9718 14.8369L1.4718 16.7369L0.471802 19.5869"
                stroke="black"
              />
              <path
                d="M45.9718 2.96191L40.4718 4.38691L34.9718 0.586914L25.4718 5.81191H16.9718L7.9718 11.0369"
                stroke="black"
              />
              <path
                d="M91.4718 10.087L89.9718 3.43701L85.9718 7.71201H80.9718L70.4718 3.43701"
                stroke="black"
              />
            </g>
            <g transform="translate(7,270)">
              <g className={`${styles.part} ${styles.tail}`}>
                <path d="M63.5 23.6719L54 36.6719V51.6719L50 62.1719L42.5 78.6719L50 103.672L42.5 134.672L50 151.172L58 158.672L54 174.172V186.672H47" />
                <path d="M64 24.1719L32.5 0.671875L17 17.6719L10 38.1719L12.5 55.6719L10 63.1719L0.5 80.6719V97.6719L3.5 106.672L7.5 111.172L3.5 123.172V138.672L7.5 146.672L17 156.172L20 170.172L28.5 180.172L34 182.172L38.5 185.172L49 186.672" />
              </g>
            </g>
            <g transform="translate(673,547)">
              <g className={`${styles.leg} ${styles.FLright}`}>
                <path
                  d="M65 3.55957H78.5L79 10.0596L72 28.5596L66 49.0596L67 85.0596L62 104.56L59.5 138.56L61 166.56L68 195.06L76 216.56L90 243.56L95.5 252.06L101.5 264.56L104 270.56L102.5 273.56L100 275.56H97L91.5 276.56L88.5 270.56L86 265.06L84.5 261.06L79.5 255.56L77.5 252.06H74V255.56L76 258.56L79.5 267.06L88.5 276.56V279.56H82H58.5L46 276.56L32 267.06L28.5 258.56V254.06L25.5 248.56V240.06L22 236.06H14.5L10.5 230.56V216.56L13 195.06V151.06L10.5 120.56L8 108.56L4.5 93.0596L2.5 81.0596V71.0596L4.5 63.5596L0.5 51.5596V29.5596L22 9.55957L31 6.05957L43.5 9.55957L57.5 0.55957L65 3.55957Z"
                  stroke="black"
                />
                <path
                  d="M87.5 238.56L83.5 243.06L78.5 247.06L71.5 249.56L64 252.06L55.5 253.56L45 256.06L33.5 258.56H28.5"
                  stroke="black"
                />
              </g>
            </g>
            <g transform="translate(577,551)">
              <g className={`${styles.leg} ${styles.FLleft}`}>
                <path
                  d="M117 4.5L123.5 0.5H0.5V4.5V16L12.5 27.5L18 32L20.5 46L24 61V93L27.5 105.5L35.5 132V177L30 209.5L27.5 227V239C28.3333 240.833 30.4 244.5 32 244.5H39.5L41.5 264.5V278L51 284L67 289L82.5 291.5H99L94 287L88 280L85 271V264.5L90 267.5L99 289L104 291.5H113.5L118.5 287L115.5 275.5L104 253L92 221L85 192.5V177V153V130L92 110.5L94 86V65.5L96 46L99 32L101.5 23L112.5 16L117 4.5Z"
                  stroke="black"
                />
                <path
                  d="M103.5 252.5L97.5 256.5L90 259.5H77.5L76.5 260.5H72.5V261.5H67L64.5 262.5L61 264L55.5 266L41.5 267.5"
                  stroke="black"
                />
              </g>
            </g>
            <g transform="translate(180,516)">
              <g className={`${styles.leg} ${styles.BLright}`}>
                <path
                  d="M23.5 50.1387L26.1667 48.1387M26.1667 48.1387L37.5 39.6387L43.5 34.1387L50.5 18.6387L63 13.1387L74.5 0.638672L84.5 6.63867H96L113 18.6387H131L123 34.1387L99.5 63.6387L84.5 84.6387L74.5 100.139V122.639V145.639L80 172.139L84.5 190.639L90.5 210.639L106 248.139L118.5 269.139L128 289.139L134.5 301.639L128 305.639H120.5L119.5 301.639L113 290.639L108.5 282.639L104 281.139L103 286.639L106 291.639L115.5 304.139L119.5 306.639L115.5 308.139H100H90.5L76.5 304.139L63 298.139L60 289.139L55 270.139L53.5 266.139L48.5 267.639H45.5L41.5 266.139L39 259.639L37.5 235.139L30 190.639L23.5 169.139L7 122.639L0.5 104.139V90.1387L13 66.6387L17 53.6387V50.1387V48.1387H26.1667Z"
                  stroke="black"
                />
                <path
                  d="M116 264.639L111 269.639L98 273.639L78 280.139L64.5 283.139H58.5"
                  stroke="black"
                />
              </g>
            </g>
            <g transform="translate(69,558)">
              <g className={`${styles.leg} ${styles.BLleft}`}>
                <path
                  d="M21.0173 4.50586L26.5173 0.505859L136.517 4.50586L128.517 8.50586L125.517 13.0059L120.017 19.0059L107.517 24.5059L87.5173 45.5059L75.5173 67.0059L67.5173 98.0059L66.0173 132.506L69.0173 172.006L77.5173 214.006L83.5173 223.506L91.5173 242.506L96.0173 250.006L104.517 271.006L99.0173 279.006H89.5173L85.5173 274.006L79.0173 259.506L73.0173 254.506L71.0173 258.006L77.5173 271.006L85.5173 282.506H83.5173H73.0173L50.0173 279.006L34.0173 271.006L26.5173 258.006L24.0173 235.506H17.5173L10.5173 230.006V214.006V198.506L13.0173 178.506L10.5173 126.506L6.51733 99.5059L3.51733 67.0059L0.517334 45.5059L6.51733 34.0059L15.0173 19.0059L21.0173 4.50586Z"
                  stroke="black"
                />
                <path
                  d="M90.0173 238.506L85.0173 241.506L80.5173 245.006L71.0173 247.506L64.5173 248.506L54.5173 251.006L42.5173 254.506L37.5173 255.506L34.0173 257.006H26.5173"
                  stroke="black"
                />
              </g>
            </g>
            <g transform="translate(737,0)">
              <path d="M243.456 246.5L251.956 249.5L269.956 252L278.456 250.5L286.956 246.5L295.456 236.5L296.456 230.5L297.956 228.5L303.456 227L309.456 223L313.956 214.5V203L316.456 200L318.456 196L318.956 192L319.456 185V180.5L316.956 172.5L308.456 158.5L289.956 135.5L260.456 104L252.956 97L251.956 94.5L247.456 91L245.456 86L242.956 80.5L235.456 69.5L231.456 65.5L232.456 59V51.5L231.956 47.5L228.956 42L224.456 37L219.956 34L213.956 31.5V30L212.456 25.5L210.456 23L207.456 19L203.456 16.5L200.956 14.5H197.456L186.456 13L184.456 10.5L181.456 8L178.456 5.5L176.456 3H171.956H165.456H158.456L150.956 7L147.456 3L139.456 0.5H133.956H126.456L118.456 3L108.456 12.5H102.956H96.9557L90.9557 15L83.4557 25H78.9557L71.4557 28L64.4557 33L61.9557 42L7.45569 97L0.455688 112.5" />
            </g>
          </g>
        </svg>
      </div>
    </LotteTriggerContext.Provider>
  );
}

export function StarsTrigger() {
  const trigger = useContext(LotteTriggerContext);

  function handleActivate() {
    trigger?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Activar a Lotte"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`absolute -top-[40%] -right-[45%] z-[4] h-[70%] w-[70%] cursor-pointer ${heroStyles.cluster}`}
    >
      <Image
        src="/images/stars.png"
        alt="Estrellas decorativas"
        width={175}
        height={160}
        className={`absolute inset-0 h-full w-full object-contain opacity-90 transition-opacity duration-300 ${heroStyles.starsImg}`}
      />
      {/* <Image
        src="/images/hummingbird.png"
        alt="Colibrí decorativo"
        width={250}
        height={250}
        className={`absolute top-[42%] left-[40%] w-[18%] origin-center drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)] transition-[filter] duration-300 ${heroStyles.hummingbirdImg}`}
      /> */}
    </div>
  );
}
