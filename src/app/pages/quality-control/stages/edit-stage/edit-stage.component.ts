import { CdkStepper } from "@angular/cdk/stepper";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { sMsg } from "src/app/core/models/shared/success-response.model";
import { QcParameterService } from "src/app/core/services/app-services/quality-control/qc-parameter.service";
import { StageService } from "src/app/core/services/app-services/quality-control/stage.service";
import { SuccessMessage } from "src/app/core/services/shared/success-message.service";

@Component({
  selector: "app-edit-stage",
  templateUrl: "./edit-stage.component.html",
  styleUrls: ["./edit-stage.component.scss"],
})
export class EditStageComponent {
  @ViewChild(CdkStepper) stepper!: CdkStepper;
  index: number = 0;

  @Input() id: string = "";
  @Input() stage: string = "";
  @Input() itemCode: string = "";

  @Output() closePopup = new EventEmitter<any>();
  @Output() closePopupAndReload = new EventEmitter<any>();

  form3: FormGroup;
  isSubmit_form3: boolean = false;
  itemsFormBuilder: FormBuilder = new FormBuilder();
  complete_form3: boolean = false;

  parameters: any[] = [];
  loadingParameters: boolean = false;

  samplingData: any = null;

  booleanDrops = [
    {
      name: "Yes",
      _id: "Yes",
    },
    { name: "No", _id: "No" },
  ];

  constructor(
    public fb: FormBuilder,
    public toastr: ToastrService,
    private successMessage: SuccessMessage,
    private stageService: StageService,
    private qcParameterService: QcParameterService
  ) {
    this.form3 = this.fb.group({
      DocumentLines: this.createitemList(),
    });
  }

  createitemList(): FormArray {
    return this.itemsFormBuilder.array([]);
  }

  createItemRow(
    relationId: string,
    parameterId: string,
    mandatory: boolean,
    minValue: string,
    maxValue: string,
    stdValue: string,
    status: boolean
  ): FormGroup {
    return this.fb.group({
      relationId: [relationId],
      parameterId: [parameterId, [Validators.required]],
      mandatory: [mandatory],
      minValue: [minValue],
      maxValue: [maxValue],
      stdValue: [stdValue],
      status: [status],
    });
  }

  syncSDta(data: any) {
    this.samplingData = data;
  }

  getSamplingValues(data: any) {
    this.samplingData = data;

    if (this.samplingData.method !== "Single-Test") {
      if (this.samplingData.samplingLogics.length === 0) {
        this.toastr.error("Please add at least one sampling logic!");
        return;
      } else {
        const isUomEmpty = this.samplingData.samplingLogics.some(
          (s_data1: any) => s_data1.uom === null || s_data1.uom === ""
        );

        const isCountEmpty = this.samplingData.samplingLogics.some(
          (s_data2: any) => s_data2.count === null || s_data2.count === ""
        );

        const isMaxEmpty = this.samplingData.samplingLogics.some(
          (s_data3: any) => s_data3.max === null || s_data3.max === ""
        );

        if (isUomEmpty) {
          this.toastr.error("UOM cannot be empty when sample mapping!");
          return;
        }

        if (isCountEmpty) {
          this.toastr.error(
            "Sampling count cannot be empty when sample mapping!"
          );
          return;
        }

        if (this.samplingData.samplingMethod === "Proportional" && isMaxEmpty) {
          this.toastr.error("Please enter all propotionl quantities!");
          return;
        }

        if (this.samplingData.samplingMethod === "Range" && isMaxEmpty) {
          this.toastr.error(
            "Please enter the upper boundary quantity for all fields!"
          );
          return;
        }
      }
    }

    this.stepper.next();
  }

  get itemList(): FormArray {
    return this.form3.get("DocumentLines") as FormArray;
  }

  getDrop(parameterId: string) {
    if (!parameterId) {
      return false;
    } else {
      const parameter = this.parameters.find(
        (param: any) => param._id === parameterId
      );

      if (parameter.type === "Boolean") {
        return true;
      } else {
        return false;
      }
    }
  }

  getParamDataCategory(parameterId: string) {
    if (!parameterId) {
      return "__";
    }

    const parameter = this.parameters.find(
      (param: any) => param._id === parameterId
    );

    return parameter.category;
  }

  getParamDataType(parameterId: string) {
    if (!parameterId) {
      return "__";
    }

    const parameter = this.parameters.find(
      (param: any) => param._id === parameterId
    );

    return parameter.type;
  }

  getParamDataCode(parameterId: string) {
    if (!parameterId) {
      return "__";
    }

    const parameter = this.parameters.find(
      (param: any) => param._id === parameterId
    );

    return parameter.code;
  }

  getParamDataName(parameterId: string) {
    if (!parameterId) {
      return "__";
    }

    const parameter = this.parameters.find(
      (param: any) => param._id === parameterId
    );

    return parameter.name;
  }

  createRow() {
    this.itemList.push(this.createItemRow(null, null, false, "", "", "", true));
  }

  disableMin(parameterId: string) {
    if (!parameterId) {
      return true;
    } else {
      const parameter = this.parameters.find(
        (param: any) => param._id === parameterId
      );

      const p_category = parameter.category;

      if (p_category === "Range" || p_category === "Grater-Than") {
        return false;
      } else {
        return true;
      }
    }
  }

  disableMax(parameterId: string) {
    if (!parameterId) {
      return true;
    } else {
      const parameter = this.parameters.find(
        (param: any) => param._id === parameterId
      );

      const p_category = parameter.category;

      if (p_category === "Range" || p_category === "Less-Than") {
        return false;
      } else {
        return true;
      }
    }
  }

  disableStd(parameterId: string) {
    if (!parameterId) {
      return true;
    } else {
      const parameter = this.parameters.find(
        (param: any) => param._id === parameterId
      );

      const p_category = parameter.category;

      if (p_category === "Fixed") {
        return false;
      } else {
        return true;
      }
    }
  }

  loadingSamplingMethoding: boolean = true;

  getParameters() {
    this.loadingSamplingMethoding = true;
    this.loadingParameters = true;

    this.qcParameterService.dropdownParameter().subscribe({
      next: (data: any[]) => {
        this.parameters = data;

        this.stageService
          .createStagedParameters({
            stage: this.stage,
            itemCode: this.itemCode,
          })
          .subscribe({
            next: (res: any) => {
              this.loadingParameters = false;

              this.samplingData = {
                method: res.head.method,
                samplingMethod: res.head.samplingMethod,
                samplingLogics: res.head.samplingLogics,
              };

              this.loadingSamplingMethoding = false;

              const relationMapper = res.relations.map((relation: any) => {
                this.itemList.push(
                  this.createItemRow(
                    relation._id,
                    relation.parameter,
                    relation.mandatory,
                    relation.minValue,
                    relation.maxValue,
                    relation.stdValue,
                    relation.status
                  )
                );
              });
            },
            error: (err) => {
              console.log(err);
              this.loadingParameters = false;
            },
          });
      },
      error: (err) => {
        console.log(err);
        this.loadingParameters = false;
      },
    });
  }

  valueFetcher(
    category: string,
    type: string,
    minValue: string,
    maxValue: string,
    stdValue: string
  ) {
    if (category === "Fixed") {
      if (type === "Percentage") {
        return `X = ${stdValue}%`;
      } else {
        return `X = ${stdValue}`;
      }
    } else if (category === "Range") {
      if (type === "Percentage") {
        return `${minValue}% < X < ${maxValue}%`;
      } else {
        return `${minValue} < X < ${maxValue}`;
      }
    } else if (category === "Grater-Than") {
      if (type === "Percentage") {
        return `${minValue}% < X`;
      } else {
        return `${minValue} < X`;
      }
    } else if (category === "Less-Than") {
      if (type === "Percentage") {
        return `${maxValue}% > X`;
      } else {
        return `${maxValue} > X`;
      }
    } else {
      return `X = ${stdValue}`;
    }
  }

  deleteRow(index: number): void {
    this.itemList.removeAt(index);
  }

  isSaving: boolean = false;

  onReset() {}

  childSubmit: boolean = false;

  submit_form3() {
    this.childSubmit = true;

    if (!this.samplingData.method || !this.samplingData.samplingMethod) {
      this.toastr.error("Please fill the form correctly!");
      this.stepper.previous();
      return;
    } else {
      if (this.samplingData.method !== "Single-Test") {
        if (this.samplingData.samplingLogics.length === 0) {
          this.toastr.error("Please add at least one sampling logic!");
          this.stepper.previous();
          return;
        } else {
          const isUomEmpty = this.samplingData.samplingLogics.some(
            (s_data1: any) => s_data1.uom === null || s_data1.uom === ""
          );

          const isCountEmpty = this.samplingData.samplingLogics.some(
            (s_data2: any) => s_data2.count === null || s_data2.count === ""
          );

          const isMaxEmpty = this.samplingData.samplingLogics.some(
            (s_data3: any) => s_data3.max === null || s_data3.max === ""
          );

          if (isUomEmpty) {
            this.toastr.error("UOM cannot be empty when sample mapping!");
            this.stepper.previous();
            return;
          }

          if (isCountEmpty) {
            this.toastr.error(
              "Sampling count cannot be empty when sample mapping!"
            );
            this.stepper.previous();
            return;
          }

          if (
            this.samplingData.samplingMethod === "Proportional" &&
            isMaxEmpty
          ) {
            this.toastr.error("Please enter all propotionl quantities!");
            this.stepper.previous();
            return;
          }

          if (this.samplingData.samplingMethod === "Range" && isMaxEmpty) {
            this.toastr.error(
              "Please enter the upper boundary quantity for all fields!"
            );
            this.stepper.previous();
            return;
          }
        }
      }
    }

    this.isSubmit_form3 = true;

    if (this.form3.invalid) {
      console.log("invalid");
    } else {
      if (this.itemList.controls.length === 0) {
        this.toastr.error("Please fill the form correctly!");
        return;
      } else {
        const error1 = this.itemList.value.find(
          (item: any) =>
            this.getParamDataCategory(item.parameterId) === "Range" &&
            (item.minValue === "" || item.maxValue === "")
        );

        if (error1) {
          this.toastr.error("Please fill all grey color fields!");
          return;
        }

        const error2 = this.itemList.value.find(
          (item: any) =>
            item.minValue === "" && item.maxValue === "" && item.stdValue === ""
        );

        if (error2) {
          this.toastr.error("Please fill all grey color fields!");
          return;
        } else {
          this.isSaving = true;

          const body = {
            headId: this.id,
            stage: this.stage,
            itemCode: this.itemCode,
            ...this.form3.value,
          };

          this.stageService.updateParameters(body).subscribe({
            next: (data: sMsg) => {
              this.isSaving = false;
              this.successMessage.show(data.message);
              this.closePopupAndReload.emit();
            },
            error: (err) => {
              console.log(err);
              this.isSaving = false;
            },
          });
        }
      }
    }
  }

  ngOnInit() {
    this.getParameters();
  }
}
