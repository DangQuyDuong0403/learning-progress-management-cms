export const FILE_NAME_PREFIXES = Object.freeze({
  STUDENT_LIST: 'student_list_',
  DAILY_CHALLENGE: 'dailychallenge_',
  SELECTED_SYLLABUSES: 'selected_syllabuses_',
});

export const formatDateForFilename = (date = new Date()) => {
  const isoDate = new Date(date).toISOString().split('T')[0];
  return isoDate.replace(/-/g, '_');
};

