import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-sample-messure",
  templateUrl: "./sample-messure.component.html",
  styleUrls: ["./sample-messure.component.scss"],
})
export class SampleMessureComponent {
  @Input() buttonName: string = "";
  @Output() getData = new EventEmitter<any>();
  @Output() syncData = new EventEmitter<any>();
  @Input() disableRowing: boolean = false;

  @Input() uom: string = null;

  testingMethod: string = "Single-Test";
  samplingMethod: string = "Fixed";

  uoms = [
    {
      name: "Kilogram",
      _id: "Kg",
    },
    {
      name: "Gram",
      _id: "g",
    },
    {
      name: "Pieces",
      _id: "Pcs",
    },
    {
      name: "Packets",
      _id: "Pkt",
    },
  ];

  testingMethods = [
    {
      name: "Single sample test",
      _id: "Single-Test",
    },
    {
      name: "Multi sample test",
      _id: "Multi-Test",
    },
  ];

  samplingMethods = [
    {
      name: "Fixed",
      _id: "Fixed",
    },
    {
      name: "Proportional",
      _id: "Proportional",
    },
    {
      name: "Range",
      _id: "Range",
    },
  ];

  form1: FormGroup;
  @Input() isSubmit_form1: boolean = false;
  submittingForm_form1: boolean = false;
  complete_form1: boolean = false;

  form2: FormGroup;
  @Input() isSubmit_form2: boolean = false;
  itemsFormBuilder: FormBuilder = new FormBuilder();
  complete_form3: boolean = false;

  createitemList(): FormArray {
    return this.itemsFormBuilder.array([]);
  }

  createItemRow(
    uom: string,
    min: string,
    max: string,
    count: string
  ): FormGroup {
    return this.fb.group({
      uom: [uom, [Validators.required]],
      min: [min, [Validators.required]],
      max: [max, [Validators.required]],
      count: [count, [Validators.required]],
    });
  }

  constructor(public fb: FormBuilder, public toastr: ToastrService) {
    this.form1 = this.fb.group({
      method: ["Single-Test", [Validators.required]],
      samplingMethod: ["Fixed", [Validators.required]],
    });

    this.form2 = this.fb.group({
      DocumentLines: this.createitemList(),
    });
  }

  get itemList(): FormArray {
    return this.form2.get("DocumentLines") as FormArray;
  }

  createRow() {
    this.itemList.push(this.createItemRow(this.uom, "0", "", ""));
  }

  createUomRow(uom: string) {
    const formItems = this.itemList.value;

    const selectedUomItems = formItems.filter(
      (f_item: any) => f_item.uom === uom
    );

    const endingMapper = selectedUomItems.map((e_item: any) => {
      return Number(e_item.max);
    });

    const newBeginValue = Math.max(...endingMapper);

    this.itemList.push(this.createItemRow(uom, `${newBeginValue}`, "", ""));
  }

  disableFinder(uom: string) {
    const formItems = this.itemList.value;

    const selectedUomItems = formItems.some(
      (f_item: any) =>
        f_item.uom === uom && (f_item.max === "" || f_item.count === "")
    );

    const isMinimumed = formItems.some(
      (f_item: any) =>
        f_item.uom === uom && Number(f_item.min) >= Number(f_item.max)
    );

    return selectedUomItems || isMinimumed;
  }

  deleteRow(index: number): void {
    this.itemList.removeAt(index);
  }

  removeAll() {
    this.itemList.clear();
  }

  syncValues() {
    const body = {
      method: this.form1.value.method,
      samplingMethod: this.form1.value.samplingMethod,
      samplingLogics: this.itemList.value,
    };

    this.syncData.emit(body);
  }

  chnageUom(uomId: string, index: number) {
    const formItems = this.itemList.value;

    const count = formItems.filter(
      (f_item: any) => f_item.uom === uomId
    ).length;

    if (count > 1) {
      const control = this.itemList.at(index);
      if (control) {
        control.get("uom").setValue(null);
        this.toastr.warning("This UOM is already selected in another row!");
      }
    }

    this.syncValues();
  }

  disableToField(index: number) {
    const control = this.itemList.at(index);
    const selectedMin = Number(control.value.min);

    if (!control.value.uom) {
      return true;
    } else {
      const formItems = this.itemList.value;

      const selectedUomArr = formItems.filter(
        (f_item: any) => f_item.uom === control.value.uom
      );

      const minValMapper = selectedUomArr.map((u_arr: any) => {
        return Number(u_arr.min);
      });

      const maximumer = Math.max(...minValMapper);

      const logger = {
        selectedMin: selectedMin,
        allMins: minValMapper,
        maximum: maximumer,
      };

      console.log(logger);

      if (selectedMin === maximumer) {
        return false;
      } else {
        return true;
      }
    }
  }

  getOriginatedUoms() {
    const formItems = this.itemList.value;

    if (formItems.length === 0) {
      return this.uoms;
    } else {
      const selectedUoms = formItems.map((f_item: any) => {
        return f_item.uom;
      });

      const result = this.uoms.filter(
        (uom: any) => !selectedUoms.includes(uom._id)
      );

      return result;
    }
  }

  changeTestingMethod() {
    if (this.form1.value.method === "Single-Test") {
      this.form1.get("samplingMethod").setValue("Fixed");
    }

    this.removeAll();
    this.syncValues();
  }

  changeSamplingMethod() {
    this.removeAll();
    this.syncValues();
  }

  getValues() {
    this.isSubmit_form1 = true;

    if (this.form1.invalid) {
      return;
    }

    this.isSubmit_form2 = true;

    const body = {
      method: this.form1.value.method,
      samplingMethod: this.form1.value.samplingMethod,
      samplingLogics: this.itemList.value,
    };

    this.getData.emit(body);
  }

  @Input() body: any = null;

  patchFormValues() {
    if (this.body) {
      this.form1.get("method").setValue(this.body.method);
      this.form1.get("samplingMethod").setValue(this.body.samplingMethod);

      if (this.body.samplingLogics && this.body.samplingLogics.length !== 0) {
        this.body.samplingLogics.map((s_logic: any) => {
          this.itemList.push(
            this.createItemRow(
              s_logic.uom,
              s_logic.min,
              s_logic.max,
              s_logic.count
            )
          );
        });
      }
    }
  }

  ngOnInit() {
    this.patchFormValues();
  }
}
