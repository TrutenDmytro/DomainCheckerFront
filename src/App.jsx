import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";
import { Card } from "primereact/card";
import { ContextMenu } from "primereact/contextmenu";
import { ToggleButton } from "primereact/togglebutton";

function App() {
  const [data, setData] = useState([]);
  const [domainInputValue, setDomainInputValue] = useState("");
  const [loadingStates, setLoadingStates] = useState({});
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isDomainInputInvalid, setIsDomainInputInvalid] = useState(false);
  const [checked, setChecked] = useState(false);
  const contextMenuItems = [
    {
      label: "Удалить",
      icon: "pi pi-trash",
      command: () => {
        handleDeleteDomain();
      },
    },
  ];
  const contextMenuRef = useRef(null);

  useEffect(() => {
    console.log("data: ", data);
  }, [data]);

  const fetchData = async () => {
    try {
      const mainResponse = await axios.get(
        "http://localhost:10000/api/get-domains"
      );
      const autoResponse = await axios.get(
        "http://localhost:10000/api/get-auto"
      );
      setData(mainResponse.data);
      setChecked(autoResponse.data[0].is_auto_enabled);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualCheckDomain = async (domainID, domain) => {
    if (!loadingStates[domainID]) {
      setLoadingStates((prevState) => ({
        ...prevState,
        [domainID]: true,
      }));

      try {
        const URL = `https://${domain}/`;
        const response = await axios.post(
          "http://localhost:10000/api/manual-check",
          { url: URL, domainID: domainID }
        );
        console.log(response);
        if (response) {
          setLoadingStates((prevState) => ({
            ...prevState,
            [domainID]: false,
          }));
        }
      } catch (err) {
        console.log(err);
        setLoadingStates((prevState) => ({
          ...prevState,
          [domainID]: false,
        }));
      }
      fetchData();
    }
  };

  const handleAutoCheckDomain = async (value) => {
    const response = await axios.post(
      "http://localhost:10000/api/auto-check",
      {is_auto_enabled: value}
    );
    console.log(response);
  };

  const handleAddDomain = async () => {
    if (!isDomainValid()) {
      setIsDomainInputInvalid(true);
      return;
    }
    try {
      setIsDomainInputInvalid(false);
      const response = await axios.post(
        "http://localhost:10000/api/add-domain",
        {
          domain: domainInputValue,
          created_at: new Date().toISOString(),
        }
      );
      if (response.data.status === 201) {
        fetchData();
        setDomainInputValue("");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteDomain = async () => {
    console.log(selectedDomain);
    setLoadingStates((prevState) => ({
      ...prevState,
      [selectedDomain]: true,
    }));
    try {
      const response = await axios.delete(
        "http://localhost:10000/api/delete-domain",
        { data: { domainID: selectedDomain } }
      );
      console.log(response);
      if (response) {
        setLoadingStates((prevState) => ({
          ...prevState,
          [selectedDomain]: true,
        }));
      }
    } catch (err) {
      console.log(err);
    }
    fetchData();
  };

  const formatAnalysisResult = (obj) => {
    if (obj.malicious) {
      return (
        <p
          style={{ color: "var(--red-500)" }}
          className="flex gap-2 align-items-center my-0"
        >
          <i className="pi pi-times-circle"></i>
          Небезопасный
        </p>
      );
    } else if (obj.suspicious) {
      return (
        <p
          style={{ color: "var(--yellow-500)" }}
          className="flex gap-2 align-items-center my-0"
        >
          <i className="pi pi-info-circle"></i>
          Подозрительный
        </p>
      );
    } else {
      return (
        <p
          style={{ color: "var(--primary-500)" }}
          className="flex gap-2 align-items-center my-0"
        >
          <i className="pi pi-check-circle"></i>
          Безопасный
        </p>
      );
    }
  };

  const handleChangeToggleButton = (value) => {
    setChecked(value);
    handleAutoCheckDomain(value);
  };

  const handleOpenContextMenu = (e, domainID) => {
    contextMenuRef.current.show(e);
    setSelectedDomain(domainID);
  };

  const formatTimestampToDate = (timestamp) => {
    const date = new Date(timestamp);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes} ${day}.${month}.${year}`;
  };

  const isDomainValid = () => {
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;
    return domainRegex.test(domainInputValue);
  };

  return (
    <>
      <ContextMenu
        model={contextMenuItems}
        ref={contextMenuRef}
        breakpoint="767px"
        onHide={() => setSelectedDomain(null)}
      />

      <div className="flex justify-content-center gap-3">
        <InputText
          invalid={isDomainInputInvalid}
          value={domainInputValue}
          onChange={(e) => setDomainInputValue(e.target.value)}
          placeholder="domain.com"
        />
        <Button
          label="Добавить"
          size="small"
          onClick={() => handleAddDomain()}
        />
        {data.length !== 0 && (
          <ToggleButton
            checked={checked}
            onChange={(e) => handleChangeToggleButton(e.value)}
            onLabel="Автопроверка: Вкл"
            offLabel="Автопроверка: Выкл"
          />
        )}
      </div>
      {data.length === 0 && (
        <h1 className="text-center mt-8">Нет сохраненных доменов</h1>
      )}
      <div className="domain-grid my-5 ">
        {data.map((obj) => (
          <Card
            className="domain-card"
            key={obj.id}
            onClick={() => handleManualCheckDomain(obj.id, obj.domain)}
            style={{ cursor: "pointer" }}
            onContextMenu={(e) => handleOpenContextMenu(e, obj.id)}
          >
            <p style={{ color: "var(--primary-500)" }}>{obj.domain}</p>
            {loadingStates[obj.id] ? (
              <ProgressBar
                mode="indeterminate"
                style={{ height: "6px", width: "100%" }}
              ></ProgressBar>
            ) : obj.analysis_result === null ? (
              <p className="flex gap-2 align-items-center my-0">
                <i className="pi pi-question-circle"></i>
                Нет результата
              </p>
            ) : (
              <div className="flex flex-column gap-2 align-items-center">
                <div className="my-0 text-center">
                  {formatAnalysisResult(obj.analysis_result)}
                </div>
                <p className="my-0 text-center">
                  Проверен в: {formatTimestampToDate(obj.checked_at)}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

export default App;
