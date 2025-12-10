import { DatePicker, Input, Select } from "antd";
import { KEY, STYLE } from "../../constants/common.const";
import { renderOption } from "../../constants/utils";
import React from "react";
import moment from "moment-timezone";
import TextArea from "antd/es/input/TextArea";
const FormInput = ({ valueObject, type = "input", refer, afterDate, beforeDate,className ,...otherPropsInput}) => {
  let InputForm = null;
  switch (type) {
    case "input": {
      InputForm = (
        <div>
          <Input
            ref={refer}
            className={valueObject.error ? STYLE.BORDER_RED : ""}
            value={valueObject.value}
            {...otherPropsInput}
          />
          {valueObject.message && (
            <p style={{ color: "red", margin: 0, marginTop: 10, padding: 0 }}>
              {valueObject.message}
            </p>
          )}
        </div>
      );
      break;
    }
    case "textarea": {
      InputForm = (
        <div>
          <TextArea
            rows={2}
            ref={refer}
            className={valueObject.error ? `${STYLE.BORDER_RED} textNote` : "textNote2"}
            value={valueObject.value}
            {...otherPropsInput}
          />
          {valueObject.message && (
            <p style={{ color: "red", margin: 0, marginTop: 10, padding: 0 }}>
              {valueObject.message}
            </p>
          )}
        </div>
      );
      break;
    }
    case "select": {
      InputForm = (
        <Select
          showSearch
          optionFilterProp="children"
          ref={refer}
          className={`${valueObject.error ? STYLE.BORDER_RED : ""} w100`}
          value={valueObject.value}
          {...otherPropsInput}
        >
          {renderOption(valueObject.options)}
        </Select>
      );
      break;
    }
    case "date": {
      const checkdate = (date) => {
        if (beforeDate) {
          return date.isSameOrBefore(beforeDate);
        }
        if (afterDate) {
          const affDate = moment(afterDate).add(1, "days").format(KEY.DATE_DEFAULT)
          return date.isSameOrAfter(affDate);
        }
        return false;
      }
      InputForm = (
        <DatePicker
          disabledDate={checkdate}
          placeholder=""
          format={KEY.DATE_DEFAULT}
          value={valueObject.value}
          className={valueObject.error ? STYLE.BORDER_RED : ""}
        {...otherPropsInput}
        />
      );
      break;
    }
    default: {
      return null;
    }
  }
  return <>{InputForm}</>;
};
export default FormInput;