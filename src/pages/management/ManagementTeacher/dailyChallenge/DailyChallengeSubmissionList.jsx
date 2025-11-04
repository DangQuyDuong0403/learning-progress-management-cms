import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Typography,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
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

const DailyChallengeSubmissionList = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search text
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchText]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyChallengeApi.getChallengeSubmissions(id, {
        page: currentPage - 1,
        size: pageSize,
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
        submissionStatus: it?.submissionStatus ?? '-',
        totalWeight: it?.totalWeight ?? it?.weight ?? null,
        actualDuration: it?.actualDuration ?? it?.duration ?? null,
        submittedAt: it?.submittedAt ?? it?.createdAt ?? null,
        totalScore: it?.totalScore ?? null,
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
  }, [id, currentPage, pageSize, debouncedSearch, t]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Derive info from navigation state (passed from Performance.jsx)
    const challengeInfo = {
      classId: location.state?.classId || null,
      className: location.state?.className || null,
      challengeId: location.state?.challengeId || id,
      challengeName: location.state?.challengeName || null,
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
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, id, location.state, user, dailyChallengeData?.subtitle, dailyChallengeData?.className]);

  // Update total count in floating menu
  useEffect(() => {
    updateChallengeCount(total);
  }, [total, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleViewClick = (submission) => {
    navigate(`/teacher/daily-challenges/detail/${id}/submission/${submission.submissionId}`,
      { state: { studentName: submission?.studentName || null } }
    );
  };

  // Fetch when pagination or search changes
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearch]);

  // Format actual duration in months, weeks, days, hours, minutes, seconds
  const formatDurationHuman = (raw) => {
    if (raw === null || raw === undefined) return '-';
    let totalSeconds = Number(raw);
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
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
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
      title: t('dailyChallenge.status'),
      dataIndex: 'submissionStatus',
      key: 'submissionStatus',
      width: 150,
      align: 'center',
      render: (status) => status || '-',
    },
    {
      title: 'Total Weight',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 140,
      align: 'center',
      render: (v) => (v === null || v === undefined ? '-' : v),
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
      title: 'Total Score',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 130,
      align: 'center',
      render: (v) => (v === null || v === undefined ? '-' : v),
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: '18px' }} />}
            onClick={() => handleViewClick(record)}
            title={t('dailyChallenge.viewDetails')}
            className="action-btn-view"
            disabled={!record?.submissionId}
          />
        </Space>
      ),
    },
  ];

  return (
    <ThemedLayout>
      <div className="daily-challenge-list-wrapper">
        {/* Search and Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className={`search-input ${theme}-search-input`}
            style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
          />
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{ paddingBottom: '24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingSubmissions')}>
            <Table
              columns={columns}
              dataSource={rows}
              rowKey="submissionId"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: setCurrentPage,
                onShowSizeChange: (current, size) => setPageSize(size),
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (tot, range) =>
                  `${range[0]}-${range[1]} ${t('dailyChallenge.of')} ${tot} ${t('dailyChallenge.submissions')}`,
                className: `${theme}-pagination`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 700 }}
              className={`daily-challenge-table ${theme}-daily-challenge-table`}
            />
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengeSubmissionList;

