export const INTERNAL_ROLES = [
  "ADMIN",
  "SALES_MANAGER",
  "CUSTOMER_RELATIONS_OFFICER",
  "OPERATIONS_MANAGER",
  "MARKETING_EXECUTIVE",
  "FINANCE_OFFICER",
];

export const ROLE_ACCESS = {
  ADMIN: {
    dashboard: true,
    apartmentsProjects: true,
    appointmentsReservations: true,
    inquiries: true,
    sales: true,
    usersStaff: true,
    paymentsTransactions: true,
    reports: true,
  },

  SALES_MANAGER: {
    dashboard: true,
    apartmentsProjects: true,
    appointmentsReservations: true,
    inquiries: false,
    sales: true,
    usersStaff: false,
    paymentsTransactions: false,
    reports: true,
  },

  CUSTOMER_RELATIONS_OFFICER: {
    dashboard: true,
    apartmentsProjects: true,
    appointmentsReservations: true,
    inquiries: true,
    sales: false,
    usersStaff: false,
    paymentsTransactions: false,
    reports: false,
  },

  OPERATIONS_MANAGER: {
    dashboard: true,
    apartmentsProjects: true,
    appointmentsReservations: true,
    inquiries: false,
    sales: false,
    usersStaff: false,
    paymentsTransactions: false,
    reports: true,
  },

  MARKETING_EXECUTIVE: {
    dashboard: true,
    apartmentsProjects: true,
    appointmentsReservations: false,
    inquiries: true,
    sales: false,
    usersStaff: false,
    paymentsTransactions: false,
    reports: true,
  },

  FINANCE_OFFICER: {
    dashboard: true,
    apartmentsProjects: false,
    appointmentsReservations: false,
    inquiries: false,
    sales: false,
    usersStaff: false,
    paymentsTransactions: true,
    reports: true,
  },
};

export const hasModuleAccess = (
  role,
  moduleName
) => {
  if (!role) {
    return false;
  }

  return Boolean(
    ROLE_ACCESS[role]?.[moduleName]
  );
};

export const isInternalRole = (role) =>
  INTERNAL_ROLES.includes(role);