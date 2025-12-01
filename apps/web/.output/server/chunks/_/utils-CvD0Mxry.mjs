function capabilityTranslationsToBatch(translations) {
  const batch = {};
  Object.entries(translations).forEach(
    ([lang, capabilityMap]) => {
      if (!capabilityMap) {
        return;
      }
      const subtree = {
        capabilities: capabilityMap
      };
      batch[lang] = subtree;
    }
  );
  return batch;
}
export {
  capabilityTranslationsToBatch as c
};
