import { LazyMotion, domAnimation, m } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

export default PageTransition;
