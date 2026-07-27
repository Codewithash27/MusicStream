import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/common/button";

export function LandingPage(): ReactElement {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(29,185,84,0.35), transparent 55%), linear-gradient(160deg, #0a0a0a 0%, #121212 45%, #052e16 100%)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 hidden w-[55%] md:block"
        style={{
          background:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231db954' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 pb-16 pt-24 md:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-extrabold tracking-tight text-ms-text sm:text-6xl md:text-7xl"
        >
          Music<span className="text-ms-primary">Stream</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-6 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl"
        >
          Your soundtrack, everywhere.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mt-4 max-w-md text-base text-ms-muted md:text-lg"
        >
          Stream millions of tracks, build playlists, and share the moments that move you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Link to="/register">
            <Button size="lg">Get started free</Button>
          </Link>
          <Link to="/home">
            <Button size="lg" variant="secondary">
              Explore music
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
