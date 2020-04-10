export const getEventStrings = (enumType): string[] => {
  return Object.keys(enumType)
    .map((eventType) => {
      // check >0 to avoid "Unknown"
      const event_name = enumType[eventType];
      if (event_name && event_name !== 'unknown') {
        return event_name;
      } else {
        return null;
      }
    }).filter((eventName) => !!eventName);
};
