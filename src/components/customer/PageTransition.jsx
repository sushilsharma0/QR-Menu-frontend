import { LazyMotion, domAnimation, m } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 20 }} // Start slightly lower and invisible
        animate={{ opacity: 1, y: 0 }}  // Slide up and fade in
        exit={{ opacity: 0, y: -20 }}   // Slide up and fade out on leave
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="w-full"
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

export default PageTransition;
