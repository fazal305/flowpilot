import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const check = () => setMatches(mql.matches);

    check();
    mql.addEventListener("change", check);
    // Some environments (notably CDP-driven viewport overrides used by
    // automated browser tools) resize the layout and update `matches`
    // without ever dispatching MediaQueryList's own "change" event — a real
    // window resize always fires it, but this fallback costs nothing and
    // makes the behavior correct either way.
    window.addEventListener("resize", check);

    return () => {
      mql.removeEventListener("change", check);
      window.removeEventListener("resize", check);
    };
  }, [query]);

  return matches;
}
