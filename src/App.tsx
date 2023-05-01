import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [employeesIsLoading, setEmployeesIsLoading] = useState<boolean>(false)
  const [transactionsIsLoading, setTransactionsIsLoading] = useState<boolean>(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllEmployees = useCallback(async () => {
    setEmployeesIsLoading(true)
    await employeeUtils.fetchAll()
  },[employeeUtils])

  const loadAllTransactions = useCallback(async () => {
    setTransactionsIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await paginatedTransactionsUtils.fetchAll()

    setTransactionsIsLoading(false)
  }, [ paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllEmployees()
      loadAllTransactions()
    }

    if(employees !== null) setEmployeesIsLoading(false)
  }, [employeeUtils.loading, employees, loadAllTransactions, loadAllEmployees])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesIsLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            newValue === EMPTY_EMPLOYEE
            ? await loadAllTransactions()
            : await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {
            transactions !== null &&
            transactionsByEmployee === null &&
            paginatedTransactions?.nextPage !== null &&
            (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await loadAllTransactions()
                }}
              >
                {transactionsIsLoading? "Loading..." : "View More"}
              </button>
            )
          }
        </div>
      </main>
    </Fragment>
  )
}
