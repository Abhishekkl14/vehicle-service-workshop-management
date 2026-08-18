import { motion } from "framer-motion";

export default function AnimatedButton({
  children,
  className = "",
  as = "button",
  ...rest
}) {
  const Component = motion[as] || motion.button;

  return (
    <Component
      {...rest}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      className={className}
    >
      {children}
    </Component>
  );
}
