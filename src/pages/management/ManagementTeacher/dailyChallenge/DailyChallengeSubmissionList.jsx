import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Input,
  Table,
  Typography,
  Tooltip,
  Modal,
  DatePicker,
  Space,
  Alert,
  Divider,
  Tag,
  Checkbox,
} from "antd";
import {
  SearchOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { dailyChallengeApi } from "../../../../apis/apis";
import { useSelector } from "react-redux";

const EXTEND_ELIGIBLE_STATUSES = new Set(["PENDING", "DRAFT"]);
const RESET_ELIGIBLE_STATUSES = new Set(["SUBMITTED", "GRADED", "MISSED"]);

const DailyChallengeSubmissionList = () => {
  const { RangePicker } = DatePicker;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, updateChallengeCount, dailyChallengeData } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge Management / Submissions');
  
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [extendDeadlineValue, setExtendDeadlineValue] = useState(null);
  const [extendSelectedSubmissionIds, setExtendSelectedSubmissionIds] = useState([]);
  const [extendSubmitting, setExtendSubmitting] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSelectedSubmissionIds, setResetSelectedSubmissionIds] = useState([]);
  const [resetDateRange, setResetDateRange] = useState([]);

  const extendEligibleRows = useMemo(() => {
    return rows.filter((item) => {
      const status = (item?.submissionStatus || "")
        .toString()
        .trim()
        .toUpperCase();
      return EXTEND_ELIGIBLE_STATUSES.has(status);
    });
  }, [rows]);

  const extendEligibleIds = useMemo(
    () =>
      extendEligibleRows
        .map((item) => item?.submissionId)
        .filter((idValue) => idValue !== null && idValue !== undefined),
    [extendEligibleRows]
  );

  const extendEligibleIdSet = useMemo(
    () => new Set(extendEligibleIds),
    [extendEligibleIds]
  );

  useEffect(() => {
    setExtendSelectedSubmissionIds((prev) =>
      prev.filter((id) => extendEligibleIdSet.has(id))
    );
  }, [extendEligibleIdSet]);

  const resetEligibleRows = useMemo(() => {
    return rows.filter((item) => {
      const status = (item?.submissionStatus || "")
        .toString()
        .trim()
        .toUpperCase();
      return RESET_ELIGIBLE_STATUSES.has(status);
    });
  }, [rows]);

  const resetEligibleIds = useMemo(
    () =>
      resetEligibleRows
        .map((item) => item?.submissionId)
        .filter((idValue) => idValue !== null && idValue !== undefined),
    [resetEligibleRows]
  );

  const resetEligibleIdSet = useMemo(
    () => new Set(resetEligibleIds),
    [resetEligibleIds]
  );

  useEffect(() => {
    setResetSelectedSubmissionIds((prev) =>
      prev.filter((id) => resetEligibleIdSet.has(id))
    );
  }, [resetEligibleIdSet]);

  // Debounce search text
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchText]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyChallengeApi.getChallengeSubmissions(id, {
        page: 0,
        size: 100,
        text: debouncedSearch,
        sortBy: 'createdAt',
        sortDir: 'asc',
      });

      const items = res?.data?.data?.content || res?.data?.data || res?.data || [];
      const totalElements =
        res?.data?.totalElements ||
        res?.data?.data?.totalElements ||
        res?.data?.pagination?.totalElements ||
        res?.data?.total ||
        (Array.isArray(items) ? items.length : 0);

      const mapped = (Array.isArray(items) ? items : []).map((it) => ({
        submissionId: it?.submissionId ?? it?.id,
        studentName: it?.studentName ?? '-',
        studentCode: it?.studentCode ?? it?.code ?? null,
        submissionStatus: it?.submissionStatus ?? '-',
        totalWeight: it?.totalWeight ?? it?.weight ?? null,
        actualDuration: it?.actualDuration ?? it?.duration ?? null,
        submittedAt: it?.submittedAt ?? it?.createdAt ?? null,
        finalScore: it?.finalScore ?? null,
        startDate: it?.startDate ?? it?.startTime ?? null,
        endDate: it?.endDate ?? it?.endTime ?? null,
      }));

      setRows(mapped);
      setTotal(totalElements);
    } catch (error) {
      spaceToast.error(t('dailyChallenge.loadSubmissionsError'));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [id, debouncedSearch, t]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Derive info from navigation state or query params (when coming back from detail via ?classId=...)
    const params = new URLSearchParams(location.search || '');
    const challengeInfo = {
      classId: location.state?.classId || params.get('classId') || null,
      className: location.state?.className || params.get('className') || null,
      challengeId: location.state?.challengeId || id,
      challengeName: location.state?.challengeName || params.get('challengeName') || null,
    };

    const getBackPath = () => {
      // Always navigate back to the performance (detail) page for this challenge
      const userRole = user?.role?.toLowerCase();
      const challengeId = challengeInfo.challengeId || id;
      const qs = new URLSearchParams();
      if (challengeInfo.classId) qs.set('classId', challengeInfo.classId);
      if (challengeInfo.className) qs.set('className', challengeInfo.className);
      if (challengeInfo.challengeName) qs.set('challengeName', challengeInfo.challengeName);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      if (userRole === 'teacher') {
        return `/teacher/daily-challenges/detail/${challengeId}${suffix}`;
      }
      if (userRole === 'teaching_assistant') {
        return `/teaching-assistant/daily-challenges/detail/${challengeId}${suffix}`;
      }
      // Fallback: teacher path
      return `/teacher/daily-challenges/detail/${challengeId}${suffix}`;
    };

    const getSubtitle = () => {
      if (challengeInfo.className && challengeInfo.challengeName) {
        return `${challengeInfo.className} / ${challengeInfo.challengeName}`;
      } else if (challengeInfo.challengeName) {
        return challengeInfo.challengeName;
      }
      // Fallback to previously preserved subtitle from context when no navigation state
      return (typeof dailyChallengeData?.subtitle === 'string' && dailyChallengeData.subtitle.trim().length > 0)
        ? dailyChallengeData.subtitle
        : null;
    };

    enterDailyChallengeMenu(0, getSubtitle(), getBackPath(), challengeInfo.className || dailyChallengeData?.className || null);
    
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, id, location.state, location.search, user, dailyChallengeData?.subtitle, dailyChallengeData?.className]);

  // Update total count in floating menu
  useEffect(() => {
    updateChallengeCount(total);
  }, [total, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleViewClick = (submission) => {
    // Preserve class/challenge info through navigation so back chain retains context
    const params = new URLSearchParams(location.search || '');
    const classId = location.state?.classId || params.get('classId') || null;
    const className = location.state?.className || params.get('className') || null;
    const challengeName = location.state?.challengeName || params.get('challengeName') || null;

    navigate(
      `/teacher/daily-challenges/detail/${id}/submissions/${submission.submissionId}`,
      {
        state: {
          studentName: submission?.studentName || null,
          classId: classId,
          className: className,
          challengeId: id,
          challengeName: challengeName,
        },
      }
    );
  };

  const openExtendModal = (submission = null) => {
    if (submission?.submissionId) {
      setExtendSelectedSubmissionIds([submission.submissionId]);
    } else {
      setExtendSelectedSubmissionIds([]);
    }
    setExtendDeadlineValue(dayjs().add(1, 'hour'));
    setExtendModalVisible(true);
  };

  const handleExtendModalClose = () => {
    if (extendSubmitting) return;
    setExtendModalVisible(false);
    setExtendDeadlineValue(null);
    setExtendSelectedSubmissionIds([]);
  };

  const handleExtendDeadlineSubmit = async () => {
    if (extendSelectedSubmissionIds.length === 0) {
      spaceToast.error('Please select at least one submission to extend.');
      return;
    }

    if (!extendDeadlineValue) {
      spaceToast.error('Please choose the new deadline.');
      return;
    }

    const invalidSelectedIds = extendSelectedSubmissionIds.filter(
      (id) => !extendEligibleIdSet.has(id)
    );
    if (invalidSelectedIds.length > 0) {
      spaceToast.error('Some selected submissions are no longer eligible for extension.');
      setExtendSelectedSubmissionIds((prev) =>
        prev.filter((id) => extendEligibleIdSet.has(id))
      );
      return;
    }

    try {
      setExtendSubmitting(true);
      await dailyChallengeApi.extendSubmissionDeadline(
        extendSelectedSubmissionIds,
        extendDeadlineValue.toISOString()
      );
      spaceToast.success('Extended deadline successfully');
      setExtendModalVisible(false);
      setExtendDeadlineValue(null);
      setExtendSelectedSubmissionIds([]);
      await fetchSubmissions();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to extend deadline';
      spaceToast.error(errorMessage);
    } finally {
      setExtendSubmitting(false);
    }
  };

  const openResetModal = () => {
    const now = dayjs().startOf('minute');
    setResetSelectedSubmissionIds([]);
    setResetDateRange([now, now.add(1, 'day')]);
    setResetModalVisible(true);
  };

  const handleResetModalClose = () => {
    if (resetSubmitting) return;
    setResetModalVisible(false);
    setResetSelectedSubmissionIds([]);
    setResetDateRange([]);
  };

  const handleResetSubmissions = async () => {
    if (resetSelectedSubmissionIds.length === 0) {
      spaceToast.error('Please select at least one submission.');
      return;
    }

    if (!resetDateRange || resetDateRange.length !== 2) {
      spaceToast.error('Please choose the start and end time.');
      return;
    }

    const [start, end] = resetDateRange;
    if (!start || !end) {
      spaceToast.error('Please choose a valid time range.');
      return;
    }

    if (end.isBefore(start)) {
      spaceToast.error('End time must be after the start time.');
      return;
    }

    const invalidResetSelection = resetSelectedSubmissionIds.filter(
      (id) => !resetEligibleIdSet.has(id)
    );
    if (invalidResetSelection.length > 0) {
      spaceToast.error('Some selected submissions are no longer eligible for reset.');
      setResetSelectedSubmissionIds((prev) =>
        prev.filter((id) => resetEligibleIdSet.has(id))
      );
      return;
    }

    try {
      setResetSubmitting(true);
      await dailyChallengeApi.resetSubmissions(
        resetSelectedSubmissionIds,
        start.toISOString(),
        end.toISOString()
      );
      spaceToast.success('Reset submissions successfully');
      setResetModalVisible(false);
      setResetSelectedSubmissionIds([]);
      setResetDateRange([]);
      await fetchSubmissions();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to reset submissions';
      spaceToast.error(errorMessage);
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleSelectAllReset = () => {
    if (resetEligibleIds.length === 0) {
      spaceToast.info('No eligible submissions to reset right now.');
      return;
    }
    setResetSelectedSubmissionIds([...resetEligibleIds]);
  };

  const handleClearResetSelection = () => {
    setResetSelectedSubmissionIds([]);
  };

  const toggleResetSelection = (submissionId, forceValue = null) => {
    if (!submissionId) return;
    if (!resetEligibleIdSet.has(submissionId)) {
      spaceToast.error('Only submitted, graded or missed submissions can be reset.');
      return;
    }
    setResetSelectedSubmissionIds((prev) => {
      const alreadySelected = prev.includes(submissionId);
      const shouldSelect =
        forceValue === null ? !alreadySelected : Boolean(forceValue);

      if (shouldSelect && !alreadySelected) {
        return [...prev, submissionId];
      }

      if (!shouldSelect && alreadySelected) {
        return prev.filter((id) => id !== submissionId);
      }

      return prev;
    });
  };

  const resetSelectedSubmissions = useMemo(
    () =>
      resetEligibleRows.filter((item) =>
        resetSelectedSubmissionIds.includes(item.submissionId)
      ),
    [resetEligibleRows, resetSelectedSubmissionIds]
  );

  const handleSelectAllExtend = () => {
    if (extendEligibleIds.length === 0) {
      spaceToast.info('No eligible submissions to extend right now.');
      return;
    }
    setExtendSelectedSubmissionIds([...extendEligibleIds]);
  };

  const handleClearExtendSelection = () => {
    setExtendSelectedSubmissionIds([]);
  };

  const toggleExtendSelection = (submissionId, forceValue = null) => {
    if (!submissionId) return;
    if (!extendEligibleIdSet.has(submissionId)) {
      spaceToast.error("Only submissions in Pending or Draft can be extended.");
      return;
    }
    setExtendSelectedSubmissionIds((prev) => {
      const alreadySelected = prev.includes(submissionId);
      const shouldSelect =
        forceValue === null ? !alreadySelected : Boolean(forceValue);

      if (shouldSelect && !alreadySelected) {
        return [...prev, submissionId];
      }

      if (!shouldSelect && alreadySelected) {
        return prev.filter((id) => id !== submissionId);
      }

      return prev;
    });
  };

  // Format actual duration in months, weeks, days, hours, minutes, seconds
  const parseIsoDurationToSeconds = (iso) => {
    if (typeof iso !== 'string' || !iso.trim()) return null;
    const match = iso
      .toUpperCase()
      .match(
        /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
      );
    if (!match) return null;
    const [
      ,
      years = '0',
      months = '0',
      weeks = '0',
      days = '0',
      hours = '0',
      minutes = '0',
      seconds = '0',
    ] = match;

    const toNumber = (value) => (value ? Number(value) : 0);
    const totalSeconds =
      toNumber(years) * 365 * 24 * 60 * 60 +
      toNumber(months) * 30 * 24 * 60 * 60 +
      toNumber(weeks) * 7 * 24 * 60 * 60 +
      toNumber(days) * 24 * 60 * 60 +
      toNumber(hours) * 60 * 60 +
      toNumber(minutes) * 60 +
      Number(seconds || 0);

    return Number.isFinite(totalSeconds) ? totalSeconds : null;
  };

  const formatDurationHuman = (raw) => {
    if (raw === null || raw === undefined) return '-';
    let totalSeconds;

    if (typeof raw === 'string') {
      const parsedIso = parseIsoDurationToSeconds(raw);
      if (parsedIso !== null) {
        totalSeconds = parsedIso;
      } else if (!Number.isNaN(Number(raw))) {
        totalSeconds = Number(raw);
      }
    } else {
      totalSeconds = Number(raw);
    }

    if (totalSeconds === undefined) {
      return String(raw);
    }

    if (!Number.isFinite(totalSeconds)) return String(raw);
    // Heuristic: if a very large value (likely milliseconds), convert to seconds
    if (totalSeconds > 1e9) totalSeconds = Math.floor(totalSeconds / 1000);
    if (totalSeconds < 0) totalSeconds = 0;

    const SEC = 1;
    const MIN = 60 * SEC;
    const HOUR = 60 * MIN;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY; // calendar approximation

    const parts = [];
    const units = [
      { size: MONTH, label: 'mo' },
      { size: WEEK, label: 'w' },
      { size: DAY, label: 'd' },
      { size: HOUR, label: 'h' },
      { size: MIN, label: 'm' },
      { size: SEC, label: 's' },
    ];

    let remaining = Math.floor(totalSeconds);
    units.forEach(({ size, label }) => {
      if (remaining >= size) {
        const count = Math.floor(remaining / size);
        remaining -= count * size;
        parts.push(`${count}${label}`);
      }
    });

    return parts.length ? parts.join(' ') : '0s';
  };

  // Format datetime as DD/MM/YYYY HH:mm:ss (date first then time)
  const formatDateTimeVi = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      const pad = (n) => String(n).padStart(2, '0');
      const dd = pad(d.getDate());
      const mm = pad(d.getMonth() + 1);
      const yyyy = d.getFullYear();
      const HH = pad(d.getHours());
      const MM = pad(d.getMinutes());
      const SS = pad(d.getSeconds());
      return `${dd}/${mm}/${yyyy} ${HH}:${MM}:${SS}`;
    } catch (_) {
      return String(value);
    }
  };

  const columns = [
    {
      title: t('common.index'),
      key: 'stt',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: t('dailyChallenge.studentName'),
      dataIndex: 'studentName',
      key: 'studentName',
      width: 220,
      align: 'left',
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip placement="topLeft" title={text || '-' }>
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
            {text || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Student Code',
      dataIndex: 'studentCode',
      key: 'studentCode',
      width: 160,
      align: 'center',
      render: (text) => (text ? text : '-'),
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 130,
      align: 'center',
      render: (v, record) => {
        // If status is MISSED, show 0
        const status = (record?.submissionStatus || '').toString().toUpperCase();
        if (status === 'MISSED') {
          return '0';
        }
        // Otherwise, show the score or '-' if null/undefined
        return (v === null || v === undefined ? '-' : v);
      },
    },
    {
      title: 'Actual Duration',
      dataIndex: 'actualDuration',
      key: 'actualDuration',
      width: 160,
      align: 'center',
      render: (v) => formatDurationHuman(v),
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 200,
      align: 'center',
      render: (v) => formatDateTimeVi(v),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 200,
      align: 'center',
      render: (v) => formatDateTimeVi(v),
    },
    {
      title: t('dailyChallenge.status'),
      dataIndex: 'submissionStatus',
      key: 'submissionStatus',
      width: 150,
      align: 'center',
      render: (status) => {
        if (!status || typeof status !== 'string') return '-';
        const s = status.trim();
        if (s.length === 0) return '-';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      },
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const status = (record?.submissionStatus || '').toString().toUpperCase();
        const actions = [];

        if (status === 'SUBMITTED') {
          actions.push({
            key: 'grade',
            element: (
              <Button
                type="primary"
                onClick={() => handleViewClick(record)}
                className="action-btn-grade"
                style={{
                  borderRadius: '6px',
                  fontWeight: 500,
                  height: '36px',
                  padding: '0 16px',
                  fontSize: '14px',
                  background: 'rgb(244,203,127)',
                  borderColor: 'rgb(244,203,127)',
                  color: '#000',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgb(224,183,107)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgb(244,203,127)';
                }}
              >
                Grade
              </Button>
            ),
          });
        } else if (status === 'GRADED') {
          actions.push({
            key: 'view',
            element: (
              <Button
                type="primary"
                onClick={() => handleViewClick(record)}
                className="action-btn-view-result"
                style={{
                  borderRadius: '6px',
                  fontWeight: 500,
                  height: '36px',
                  padding: '0 16px',
                  fontSize: '14px',
                  background: 'rgb(157,207,242)',
                  borderColor: 'rgb(157,207,242)',
                  color: '#000',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgb(137,187,222)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgb(157,207,242)';
                }}
              >
                View result
              </Button>
            ),
          });
        }

        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '8px' }}>
            {actions.map(({ key, element }) => (
              <React.Fragment key={key}>{element}</React.Fragment>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <ThemedLayout>
      <div className="daily-challenge-list-wrapper">
        {/* Search and Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className={`search-input ${theme}-search-input`}
            style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
          />
          <Space>
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => openExtendModal()}
              style={{
                height: '40px',
                borderRadius: '8px',
                fontWeight: 500,
              }}
            >
              Extend submissions
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={openResetModal}
              style={{
                height: '40px',
                borderRadius: '8px',
                fontWeight: 500,
              }}
            >
              Reset submissions
            </Button>
          </Space>
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{ paddingBottom: '24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingSubmissions')}>
            <Table
              columns={columns}
              dataSource={rows}
              rowKey="submissionId"
              pagination={false}
              scroll={{ x: 700 }}
              className={`daily-challenge-table ${theme}-daily-challenge-table`}
            />
          </LoadingWithEffect>
        </div>
        <Modal
          open={extendModalVisible}
          onCancel={handleExtendModalClose}
          destroyOnClose
          width={900}
          bodyStyle={{ padding: '24px 32px 8px' }}
          title={
            <div
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: theme === 'sun' ? 'rgb(24, 144, 255)' : '#8B5CF6',
                textAlign: 'center',
                padding: '10px 0',
              }}
            >
              Extend submission deadline
            </div>
          }
          footer={[
            <Button
              key="cancel"
              onClick={handleExtendModalClose}
              style={{
                height: '32px',
                fontWeight: 500,
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px',
              }}
              disabled={extendSubmitting}
            >
              Cancel
            </Button>,
            <Button
              key="confirm"
              type="primary"
              onClick={handleExtendDeadlineSubmit}
              loading={extendSubmitting}
              style={{
                background:
                  theme === 'sun'
                    ? 'rgb(113, 179, 253)'
                    : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
                borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                color: theme === 'sun' ? '#000' : '#fff',
                borderRadius: '6px',
                height: '32px',
                fontWeight: 500,
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px',
                transition: 'all 0.3s ease',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                if (extendSubmitting) return;
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(95, 160, 240)';
                  e.currentTarget.style.borderColor = 'rgb(95, 160, 240)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(113, 179, 253, 0.4)';
                } else {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
                  e.currentTarget.style.borderColor = '#5a1fb8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(114, 40, 217, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (extendSubmitting) return;
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(113, 179, 253)';
                  e.currentTarget.style.borderColor = 'rgb(113, 179, 253)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                } else {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
                  e.currentTarget.style.borderColor = '#7228d9';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              Confirm
            </Button>,
          ]}
        >
          <Typography.Paragraph style={{ marginBottom: 12 }}>
            Pick a new deadline for the selected submissions.
          </Typography.Paragraph>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  value={extendDeadlineValue}
                  onChange={(value) => setExtendDeadlineValue(value)}
                  style={{ flex: 1, minWidth: 220 }}
                  format="DD/MM/YYYY HH:mm"
                  disabledDate={(current) => current.isBefore(dayjs().startOf('minute'))}
                  allowClear={false}
                />
                <Space>
                  <Button size="small" onClick={handleSelectAllExtend}>
                    Select all
                  </Button>
                  <Button size="small" onClick={handleClearExtendSelection}>
                    Clear selection
                  </Button>
                </Space>
              </div>
              <Typography.Text type="secondary" style={{ display: 'block' }}>
                Only submissions in Pending or Draft can be extended. The new deadline must be in the future.
              </Typography.Text>
            </div>

            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
                Class submission list
              </Typography.Text>
              <div
                style={{
                  maxHeight: 360,
                  overflowY: 'auto',
                  padding: 4,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  }}
                >
                  {extendEligibleRows.map((item) => {
                    const checked = extendSelectedSubmissionIds.includes(item.submissionId);
                    return (
                      <div
                        key={item.submissionId}
                        onClick={() => toggleExtendSelection(item.submissionId)}
                        style={{
                          borderRadius: 16,
                          border: checked ? '2px solid #1890ff' : '1px solid #e5e5e5',
                          background: checked ? 'rgba(24,144,255,0.08)' : '#ffffff',
                          padding: '16px 18px',
                          cursor: 'pointer',
                          boxShadow: checked
                            ? '0 12px 24px rgba(24,144,255,0.18)'
                            : '0 4px 16px rgba(0,0,0,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleExtendSelection(item.submissionId, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ transform: 'scale(1.1)' }}
                          />
                          <div>
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              {item.studentName || `ID ${item.submissionId}`}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                              {item.studentCode ? `Code: ${item.studentCode}` : 'No student code'}
                            </Typography.Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {extendEligibleRows.length === 0 && (
                    <Alert
                      type="info"
                      showIcon
                      message="No submissions are currently pending or in draft."
                      style={{ gridColumn: '1 / -1' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          open={resetModalVisible}
          onCancel={handleResetModalClose}
          confirmLoading={resetSubmitting}
          width={900}
          destroyOnClose
          bodyStyle={{ padding: '24px 32px 8px' }}
          title={
            <div
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: theme === 'sun' ? 'rgb(24, 144, 255)' : '#8B5CF6',
                textAlign: 'center',
                padding: '10px 0',
              }}
            >
              Reset submissions (create new attempt)
            </div>
          }
          footer={[
            <Button
              key="cancel"
              onClick={handleResetModalClose}
              disabled={resetSubmitting}
              style={{
                height: '32px',
                fontWeight: 500,
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px',
              }}
            >
              Cancel
            </Button>,
            <Button
              key="confirm"
              type="primary"
              onClick={handleResetSubmissions}
              loading={resetSubmitting}
              style={{
                background:
                  theme === 'sun'
                    ? 'rgb(113, 179, 253)'
                    : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
                borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                color: theme === 'sun' ? '#000' : '#fff',
                borderRadius: '6px',
                height: '32px',
                fontWeight: 500,
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px',
                transition: 'all 0.3s ease',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                if (resetSubmitting) return;
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(95, 160, 240)';
                  e.currentTarget.style.borderColor = 'rgb(95, 160, 240)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(113, 179, 253, 0.4)';
                } else {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
                  e.currentTarget.style.borderColor = '#5a1fb8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(114, 40, 217, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (resetSubmitting) return;
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(113, 179, 253)';
                  e.currentTarget.style.borderColor = 'rgb(113, 179, 253)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                } else {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
                  e.currentTarget.style.borderColor = '#7228d9';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              Reset
            </Button>,
          ]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Working time window
                </Typography.Text>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <RangePicker
                    showTime={{ format: 'HH:mm' }}
                    value={resetDateRange}
                    onChange={(value) => setResetDateRange(value || [])}
                    style={{ flex: 1, minWidth: 220 }}
                    format="DD/MM/YYYY HH:mm"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf('day')
                    }
                  />
                  <Space>
                    <Button size="small" onClick={handleSelectAllReset}>
                      Select all
                    </Button>
                    <Button size="small" onClick={handleClearResetSelection}>
                      Clear selection
                    </Button>
                  </Space>
                </div>
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                  Only submissions that were submitted, graded, or missed can be reset.
                </Typography.Text>
              </div>
            </div>

            <div
              style={{
                background: '#fafafa',
                borderRadius: 12,
                border: '1px solid #e8e8e8',
                padding: '16px',
                minHeight: 165,
              }}
            >
              <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
                Selected submissions
              </Typography.Text>
              {resetSelectedSubmissions.length === 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message="No submissions selected."
                  description="Please use the list below to choose the students who need a reset."
                />
              ) : (
                <Space size={[8, 8]} wrap>
                  {resetSelectedSubmissions.slice(0, 8).map((item) => {
                    const displayName = item.studentName || `ID ${item.submissionId}`;
                    const codeSuffix = item.studentCode ? ` (${item.studentCode})` : '';
                    return (
                      <Tag
                        key={item.submissionId}
                        color="blue"
                        style={{ padding: '6px 10px', borderRadius: 999 }}
                      >
                        {displayName}
                        {codeSuffix}
                      </Tag>
                    );
                  })}
                  {resetSelectedSubmissions.length > 8 && (
                    <Tag color="blue">
                      +{resetSelectedSubmissions.length - 8} other students
                    </Tag>
                  )}
                </Space>
              )}
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
                Class submission list
              </Typography.Text>
              <div
                style={{
                  maxHeight: 360,
                  overflowY: 'auto',
                  padding: 4,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  }}
                >
                  {resetEligibleRows.map((item) => {
                    const checked = resetSelectedSubmissionIds.includes(item.submissionId);
                    const statusText =
                      typeof item.submissionStatus === 'string'
                        ? item.submissionStatus.charAt(0).toUpperCase() +
                          item.submissionStatus.slice(1).toLowerCase()
                        : '-';
                    const submittedAtText = formatDateTimeVi(item.submittedAt);
                    const startAtText = formatDateTimeVi(item.startDate);
                    const endAtText = formatDateTimeVi(item.endDate);
                    return (
                      <div
                        key={item.submissionId}
                        onClick={() => toggleResetSelection(item.submissionId)}
                        style={{
                          borderRadius: 16,
                          border: checked ? '2px solid #1890ff' : '1px solid #e5e5e5',
                          background: checked ? 'rgba(24,144,255,0.08)' : '#ffffff',
                          padding: '16px 18px',
                          cursor: 'pointer',
                          boxShadow: checked
                            ? '0 12px 24px rgba(24,144,255,0.18)'
                            : '0 4px 16px rgba(0,0,0,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleResetSelection(item.submissionId, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ transform: 'scale(1.1)' }}
                          />
                          <div>
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              {item.studentName || `ID ${item.submissionId}`}
                            </Typography.Text>
                            {item.studentCode && (
                              <Typography.Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                                Student code: {item.studentCode}
                              </Typography.Text>
                            )}
                            <div style={{ marginTop: 8 }}>
                              <Tag color="blue" style={{ borderRadius: 999 }}>
                                {statusText}
                              </Tag>
                            </div>
                            <Typography.Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                              Start: {startAtText}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                              End: {endAtText}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                              Submitted at: {submittedAtText}
                            </Typography.Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {resetEligibleRows.length === 0 && (
                    <Alert
                      type="info"
                      showIcon
                      message="No submissions are currently eligible for reset."
                      style={{ gridColumn: '1 / -1' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengeSubmissionList;

