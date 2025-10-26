import React from "react";
import DailyChallengeList from "../ManagementTeacher/dailyChallenge/DailyChallengeList";

/**
 * Wrapper component for Student view of Daily Challenge List
 * This reuses the teacher's DailyChallengeList component but in view-only mode
 */
const StudentDailyChallengeList = (props) => {
  return <DailyChallengeList {...props} readOnly={true} />;
};

export default StudentDailyChallengeList;

